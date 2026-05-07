import React, { useState, useEffect, useMemo } from 'react';
import { CapacitorHttp } from '@capacitor/core';

// استيراد المكونات
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

  // --- دوال المزامنة ---
  const syncWithCloud = async (collectionName, data) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return;
    try {
      await CapacitorHttp.post({
        url: 'https://maamoul-pro-five.vercel.app/api/sync',
        headers: { 'Content-Type': 'application/json' },
        data: { collectionName, data },
      });
    } catch (error) { console.error("Sync Error:", collectionName); }
  };

  const fetchFromCloud = async (collectionName, setter) => {
    try {
      const response = await CapacitorHttp.get({
        url: 'https://maamoul-pro-five.vercel.app/api/get-data',
        params: { collectionName }
      });
      if (response.data?.success && response.data?.data) {
        const cloudData = response.data.data;
        const localData = JSON.parse(localStorage.getItem(collectionName) || '[]');
        const mergedData = cloudData.length >= localData.length ? cloudData : localData;
        setter(mergedData);
        localStorage.setItem(collectionName, JSON.stringify(mergedData));
      }
    } catch (error) { console.error("Fetch Error:", collectionName); }
  };

  const loadInitial = (key, initialValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  };

  // --- الحالات (States) ---
  const [stock, setStock] = useState(() => loadInitial('stock', []));
  const [salesData, setSalesData] = useState(() => loadInitial('salesData', []));
  const [inventory, setInventory] = useState(() => loadInitial('inventory', []));
  const [expenses, setExpenses] = useState(() => loadInitial('expenses', []));
  const [waste, setWaste] = useState(() => loadInitial('waste', []));
  const [suppliers, setSuppliers] = useState(() => loadInitial('suppliers', []));
  const [customers, setCustomers] = useState(() => loadInitial('customers', []));
  const [productionData, setProductionData] = useState(() => loadInitial('productionData', []));
  const [supplierWaitingList, setSupplierWaitingList] = useState(() => loadInitial('waitingList', []));
  const [cashBook, setCashBook] = useState(() => loadInitial('cashBook', []));
  const [staff, setStaff] = useState(() => loadInitial('staff', []));

  useEffect(() => {
    const cols = ['stock', 'salesData', 'inventory', 'expenses', 'waste', 'suppliers', 'customers', 'productionData', 'waitingList', 'cashBook', 'staff'];
    cols.forEach(col => {
      const setters = { stock: setStock, salesData: setSalesData, inventory: setInventory, expenses: setExpenses, waste: setWaste, suppliers: setSuppliers, customers: setCustomers, productionData: setProductionData, waitingList: setSupplierWaitingList, cashBook: setCashBook, staff: setStaff };
      fetchFromCloud(col, setters[col]);
    });
  }, []);

  useEffect(() => {
    const syncMap = { stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, waitingList: supplierWaitingList, cashBook, staff };
    Object.entries(syncMap).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
      syncWithCloud(key, val);
    });
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff]);

  // --- منطق الحسابات ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchases = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    return { totalIncome, totalExpenses: totalExp, cashBalance: totalIncome - (totalExp + totalPurchases), stockValue: stock.reduce((sum, s) => sum + (s.balance * s.price), 0) };
  }, [salesData, expenses, inventory, stock]);

  const addCashEntry = (entry) => {
    const newEntry = { ...entry, id: Date.now(), displayDate: new Date().toLocaleString('ar-EG'), timestamp: new Date().toISOString() };
    setCashBook(prev => [newEntry, ...prev]);
  };

  // --- معالجات الأحداث ---
  const handleSavePurchase = (p) => {
    setInventory(prev => [...prev, p]);
    setStock(prev => {
      const idx = prev.findIndex(s => s.name === p.item);
      const qty = parseFloat(p.quantity || 0);
      if (idx > -1) {
        const up = [...prev];
        up[idx].balance += qty;
        up[idx].batches = [...(up[idx].batches || []), { date: p.date, qty, cost: p.price }];
        return up;
      }
      return [...prev, { id: Date.now(), name: p.item, balance: qty, price: p.price, unit: p.unit, batches: [{ date: p.date, qty, cost: p.price }] }];
    });
    if (p.paymentMethod === 'كاش') addCashEntry({ type: 'صادر', category: 'مشتريات', amount: p.total, description: `شراء: ${p.item}` });
    setActivePage('dashboard');
  };

  const handleDirectStockAdd = (item) => setStock(prev => [...prev, { ...item, id: Date.now(), batches: [{ date: new Date().toLocaleDateString(), qty: item.balance, cost: item.price }] }]);

  // --- رندرة الصفحات المصلحة (لحل مشكلة الصفحة البيضاء) ---
  const renderPage = () => {
    const cp = { onBack: () => setActivePage('dashboard') };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
      case 'inventory': return <Inventory {...cp} categories={stock} onAddItem={handleDirectStockAdd} onDeleteItem={(id) => setStock(prev => prev.filter(i => i.id !== id))} />;
      case 'purchases': return <PurchasesManager {...cp} stock={stock} onPurchaseComplete={handleSavePurchase} onOrderTrigger={(d) => setSupplierWaitingList(prev => [d, ...prev])} />;
      case 'sales': return <Sales {...cp} onSaveSale={(s) => { setSalesData(prev => [...prev, s]); addCashEntry({type:'وارد', category:'مبيعات', amount:s.total, description:s.productName}); }} customers={customers} stock={stock} />;
      case 'expenses': return <Expenses {...cp} onSaveExpense={(e) => { setExpenses(prev => [...prev, e]); addCashEntry({type:'صادر', category:e.category, amount:e.amount, description:e.description}); }} />;
      case 'suppliers': return <Suppliers {...cp} suppliers={suppliers} waitingList={supplierWaitingList} onAddSupplier={(s) => setSuppliers(prev => [...prev, s])} onPayDebt={(name, amt) => addCashEntry({type:'صادر', category:'سداد مورد', amount:amt, description:name})} />;
      case 'customers': return <Customers {...cp} customers={customers} onAddCustomer={(c) => setCustomers(prev => [...prev, c])} />;
      case 'financials': return <Financials {...cp} stats={financialStats} cashBook={cashBook} />;
      case 'staff': return <StaffManagement {...cp} staff={staff} onAddStaff={(e) => setStaff(prev => [...prev, e])} />;
      case 'reports': return <Reports {...cp} inventory={inventory} stock={stock} salesData={salesData} expenses={expenses} staff={staff} />;
      case 'settings': return <Settings />;
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        <button className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
          <i className="icon-home"></i>
          <span>الرئيسية</span>
        </button>
        <button className={`nav-item ${activePage === 'inventory' ? 'active' : ''}`} onClick={() => setActivePage('inventory')}>
          <i className="icon-box"></i>
          <span>المخزن</span>
        </button>
        <button className={`nav-item ${['purchases', 'sales', 'expenses'].includes(activePage) ? 'active' : ''}`} onClick={() => setActivePage('purchases')}>
          <i className="icon-ops"></i>
          <span>العمليات</span>
        </button>
        <button className={`nav-item ${activePage === 'reports' ? 'active' : ''}`} onClick={() => setActivePage('reports')}>
          <i className="icon-chart"></i>
          <span>التقارير</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
