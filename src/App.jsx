import React, { useState, useEffect, useMemo } from 'react';
// استيراد CapacitorHttp للتعامل مع الاتصال الخارجي
import { CapacitorHttp } from '@capacitor/core';

import Dashboard from './components/Dashboard';
import PurchasesManager from './components/PurchasesManager';
import Sales from './components/Sales';
import Waste from './components/Waste';
import Expenses from './components/Expenses';
import Suppliers from './components/Suppliers';
import Financials from './components/Financials';
import Reports from './components/Reports';
import Customers from './components/Customers';
import Inventory from './components/Inventory';
import ProductionManager from './components/ProductionManager';
import StaffManagement from './components/StaffManagement';
import Settings from './components/Settings';

import './App.css';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');

  // --- دالة المزامنة الخارجية (API Sync) ---
  const syncWithCloud = async (collectionName, data) => {
    try {
      const options = {
        url: 'https://maamoul-pro.vercel.app/api/sync',
        headers: { 'Content-Type': 'application/json' },
        data: {
          collection: collectionName,
          payload: data
        },
      };
      // استخدام CapacitorHttp.post لإرسال البيانات
      await CapacitorHttp.post(options);
      console.log(`تمت مزامنة ${collectionName} مع السحابة بنجاح`);
    } catch (error) {
      console.error("خطأ في المزامنة الخارجية:", error);
    }
  };

  const loadSavedData = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) {
      return initialValue;
    }
  };

  const [stock, setStock] = useState(() => loadSavedData('stock', []));
  const [salesData, setSalesData] = useState(() => loadSavedData('salesData', []));
  const [inventory, setInventory] = useState(() => loadSavedData('inventory', []));
  const [expenses, setExpenses] = useState(() => loadSavedData('expenses', []));
  const [waste, setWaste] = useState(() => loadSavedData('waste', []));
  const [suppliers, setSuppliers] = useState(() => loadSavedData('suppliers', []));
  const [customers, setCustomers] = useState(() => loadSavedData('customers', []));
  const [productionData, setProductionData] = useState(() => loadSavedData('productionData', []));
  const [supplierWaitingList, setSupplierWaitingList] = useState(() => loadSavedData('waitingList', []));
  const [cashBook, setCashBook] = useState(() => loadSavedData('cashBook', []));
  const [staff, setStaff] = useState(() => loadSavedData('staff', []));

  useEffect(() => {
    const keys = { stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, waitingList: supplierWaitingList, cashBook, staff };
    Object.entries(keys).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
      // مزامنة كل قسم عند حدوث تغيير فيه
      syncWithCloud(key, val);
    });
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff]);

  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalWasteValue = waste.reduce((sum, w) => {
      const item = stock.find(s => s.name === (w.itemName || w.item));
      return sum + ((parseFloat(w.quantity) || 0) * (item ? (item.price || 0) : 0));
    }, 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExpenses + totalPurchasesCash);
    const stockValue = stock.reduce((sum, s) => sum + ((parseFloat(s.balance) || 0) * (parseFloat(s.price) || 0)), 0);
    const netProfit = totalIncome - totalExpenses - totalWasteValue - totalPurchasesCash;
    const totalSalaries = staff.filter(s => s.status === 'نشط').reduce((sum, s) => sum + (parseFloat(s.salary) || 0), 0);
    return { totalIncome, totalExpenses, totalWasteValue, totalPurchasesCash, totalCashIn: totalIncome, totalCashOut: totalExpenses + totalPurchasesCash, cashBalance, stockValue, netProfit, totalSalaries };
  }, [salesData, expenses, waste, stock, inventory, staff]);

  const addCashEntry = (entry) => {
    setCashBook(prev => [...prev, { ...entry, id: Date.now(), timestamp: new Date().toLocaleString() }]);
  };

  const handleSavePurchase = (newPurchase) => {
    const total = parseFloat(newPurchase.total || (newPurchase.quantity * newPurchase.price) || 0);
    setInventory(prev => [...prev, newPurchase]);
    setStock(prevStock => {
      const existing = prevStock.findIndex(s => s.name === newPurchase.item);
      const qty = parseFloat(newPurchase.quantity || 0);
      const price = parseFloat(newPurchase.price || 0);
      if (existing > -1) {
        const updated = [...prevStock];
        updated[existing] = { ...updated[existing], balance: (updated[existing].balance || 0) + qty, price: price || updated[existing].price };
        return updated;
      }
      return [...prevStock, { id: Date.now(), name: newPurchase.item, balance: qty, price, unit: newPurchase.unit || 'وحدة' }];
    });
    if (newPurchase.paymentMethod === 'كاش') addCashEntry({ type: 'out', category: 'مشتريات', amount: total, description: `شراء: ${newPurchase.item}` });
    else if (newPurchase.paymentMethod === 'آجل' && newPurchase.supplier) setSuppliers(prev => prev.map(s => s.name === newPurchase.supplier ? { ...s, debt: (parseFloat(s.debt) || 0) + total } : s));
    setActivePage('dashboard');
  };

  const handleSaveSale = (sale) => {
    setSalesData(prev => [...prev, sale]);
    setStock(prev => prev.map(item => item.name === sale.productName ? { ...item, balance: Math.max(0, (item.balance || 0) - parseFloat(sale.quantity || 0)) } : item));
    addCashEntry({ type: 'in', category: 'مبيعات', amount: parseFloat(sale.total || 0), description: `بيع: ${sale.productName} - ${sale.customerName}` });
  };

  const handleSaveWaste = (wasteEntry) => {
    setWaste(prev => [...prev, wasteEntry]);
    const itemName = wasteEntry.itemName || wasteEntry.item;
    if (itemName) setStock(prev => prev.map(item => item.name === itemName ? { ...item, balance: Math.max(0, (item.balance || 0) - parseFloat(wasteEntry.quantity || 0)) } : item));
  };

  const handleSaveExpense = (expense) => {
    setExpenses(prev => [...prev, expense]);
    addCashEntry({ type: 'out', category: expense.category, amount: parseFloat(expense.amount || 0), description: expense.description });
  };

  const handleSaveProduction = (production) => setProductionData(prev => [...prev, production]);
  const handleOrderTrigger = (orderData) => setSupplierWaitingList(prev => [orderData, ...prev]);
  const handleAddSupplier = (supplier) => setSuppliers(prev => [...prev, { ...supplier, debt: supplier.debt || 0 }]);
  const handleAddCustomer = (customer) => setCustomers(prev => [...prev, customer]);
  const handlePaySupplierDebt = (supplierName, amount) => {
    setSuppliers(prev => prev.map(s => s.name === supplierName ? { ...s, debt: Math.max(0, (parseFloat(s.debt) || 0) - parseFloat(amount)) } : s));
    addCashEntry({ type: 'out', category: 'سداد موردين', amount: parseFloat(amount), description: `سداد ديون: ${supplierName}` });
  };

  const handleAddStaff = (employee) => setStaff(prev => [...prev, employee]);
  const handleUpdateStaff = (id, updatedData) => setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  const handleDeleteStaff = (id) => setStaff(prev => prev.filter(s => s.id !== id));

  const goHome = () => setActivePage('dashboard');

  const renderPage = () => {
    const cp = { onBack: goHome };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.filter(s => s.status === 'نشط').length} />;
      case 'purchases': return <PurchasesManager {...cp} stock={stock} onPurchaseComplete={handleSavePurchase} onOrderTrigger={handleOrderTrigger} />;
      case 'suppliers': return <Suppliers {...cp} suppliers={suppliers} waitingList={supplierWaitingList} onAddSupplier={handleAddSupplier} onUpdateWaitingList={setSupplierWaitingList} onPayDebt={handlePaySupplierDebt} />;
      case 'inventory': return <Inventory {...cp} categories={stock} />;
      case 'sales': return <Sales {...cp} onSaveSale={handleSaveSale} customers={customers} stock={stock} />;
      case 'production': return <ProductionManager {...cp} stock={stock} setStock={setStock} onSaveProduction={handleSaveProduction} onSaveWaste={handleSaveWaste} />;
      case 'waste': return <Waste {...cp} inventory={stock} onSaveWaste={handleSaveWaste} />;
      case 'expenses': return <Expenses {...cp} onSaveExpense={handleSaveExpense} />;
      case 'customers': return <Customers {...cp} customers={customers} onAddCustomer={handleAddCustomer} />;
      case 'financials': return <Financials {...cp} stats={financialStats} cashBook={cashBook} />;
      case 'staff': return <StaffManagement {...cp} staff={staff} onAddStaff={handleAddStaff} onUpdateStaff={handleUpdateStaff} onDeleteStaff={handleDeleteStaff} />;
      case 'reports': return <Reports {...cp} inventory={inventory} stock={stock} salesData={salesData} expenses={expenses} staff={staff} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.filter(s => s.status === 'نشط').length} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: 'home' },
    { id: 'inventory', label: 'المخزن', icon: 'box' },
    { id: 'purchases', label: 'العمليات', icon: 'ops' },
    { id: 'reports', label: 'التقارير', icon: 'chart' },
  ];

  const renderNavIcon = (iconType, isActive) => {
    const fill = isActive ? '#ff4d7d' : 'none';
    const stroke = isActive ? '#ff4d7d' : '#94a3b8';
    const props = { width: 26, height: 26, viewBox: '0 0 24 24', fill, stroke, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (iconType) {
      case 'home': return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
      case 'box': return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
      case 'ops': return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
      case 'chart': return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
      default: return null;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {navItems.map(item => {
          const isActive = activePage === item.id || (item.id === 'purchases' && ['purchases', 'sales', 'production', 'waste', 'expenses'].includes(activePage));
          return (
            <button key={item.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
              {renderNavIcon(item.icon, isActive)}
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
