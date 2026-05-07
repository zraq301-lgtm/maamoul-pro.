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

  // --- دوال المزامنة المتطورة ---
  const syncWithCloud = async (collectionName, data) => {
    if (!data) return;
    try {
      await CapacitorHttp.post({
        url: 'https://maamoul-pro-five.vercel.app/api/sync',
        headers: { 'Content-Type': 'application/json' },
        data: { collectionName, data },
      });
    } catch (error) {
      console.error(`❌ فشل مزامنة ${collectionName}`);
    }
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
        
        // مطابقة البيانات: دمج بيانات السحاب مع البيانات المحلية (الأحدث يفوز)
        const mergedData = cloudData.length >= localData.length ? cloudData : localData;
        setter(mergedData);
        localStorage.setItem(collectionName, JSON.stringify(mergedData));
      }
    } catch (error) {
      console.error(`❌ خطأ في جلب ${collectionName}`);
    }
  };

  const loadInitial = (key, initialValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  };

  // --- حالات التطبيق (States) ---
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

  // جلب البيانات عند التشغيل
  useEffect(() => {
    const collections = ['stock', 'salesData', 'inventory', 'expenses', 'waste', 'suppliers', 'customers', 'productionData', 'waitingList', 'cashBook', 'staff'];
    collections.forEach(col => fetchFromCloud(col, (data) => {
      if (col === 'stock') setStock(data);
      if (col === 'salesData') setSalesData(data);
      if (col === 'inventory') setInventory(data);
      // ... وهكذا لبقية الحالات
    }));
  }, []);

  // المزامنة التلقائية عند تغيير أي بيان
  useEffect(() => {
    const syncMap = { stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, waitingList: supplierWaitingList, cashBook, staff };
    Object.entries(syncMap).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
      syncWithCloud(key, val);
    });
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff]);

  // --- منطق ERP والجداول ---
  const addCashEntry = (entry) => {
    const newEntry = {
      ...entry,
      id: Date.now(),
      // مطابقة صيغة الصورة: التاريخ، البيان، النوع، المبلغ
      displayDate: new Date().toLocaleString('ar-EG'), 
      timestamp: new Date().toISOString()
    };
    setCashBook(prev => [newEntry, ...prev]);
  };

  const handleDirectStockAdd = (newItem) => {
    setStock(prev => [...prev, {
      ...newItem,
      id: Date.now(),
      balance: parseFloat(newItem.balance) || 0,
      batches: [{ date: new Date().toLocaleDateString(), qty: newItem.balance, cost: newItem.price }]
    }]);
  };

  const handleSavePurchase = (newPurchase) => {
    const total = parseFloat(newPurchase.total || (newPurchase.quantity * newPurchase.price) || 0);
    setInventory(prev => [...prev, newPurchase]);
    setStock(prevStock => {
      const existingIdx = prevStock.findIndex(s => s.name === newPurchase.item);
      const qty = parseFloat(newPurchase.quantity || 0);
      const price = parseFloat(newPurchase.price || 0);
      if (existingIdx > -1) {
        const updated = [...prevStock];
        updated[existingIdx].balance += qty;
        updated[existingIdx].batches = [...(updated[existingIdx].batches || []), { date: newPurchase.date, qty, cost: price }];
        return updated;
      }
      return [...prevStock, { id: Date.now(), name: newPurchase.item, balance: qty, price, unit: newPurchase.unit, batches: [{ date: newPurchase.date, qty, cost: price }] }];
    });
    addCashEntry({ type: 'صادر', category: 'شراء دقيق', amount: total, description: `شراء: ${newPurchase.item}` });
  };

  const handleSaveSale = (sale) => {
    setSalesData(prev => [...prev, sale]);
    setStock(prev => prev.map(item => item.name === sale.productName ? { ...item, balance: Math.max(0, item.balance - parseFloat(sale.quantity)) } : item));
    addCashEntry({ type: 'وارد', category: 'مبيعات', amount: parseFloat(sale.total), description: `بيع: ${sale.productName}` });
  };

  // --- رندرة الصفحات ---
  const renderPage = () => {
    const cp = { onBack: () => setActivePage('dashboard') };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
      case 'inventory': return (
        <Inventory 
          {...cp} 
          categories={stock} 
          onAddItem={handleDirectStockAdd} // إضافة مباشرة مفعلة هنا
          onDeleteItem={(id) => setStock(prev => prev.filter(i => i.id !== id))} 
        />
      );
      case 'purchases': return <PurchasesManager {...cp} stock={stock} onPurchaseComplete={handleSavePurchase} />;
      case 'financials': return <Financials {...cp} stats={financialStats} cashBook={cashBook} />; // عرض البيانات المجدولة مثل الصورة
      case 'reports': return <Reports {...cp} inventory={inventory} stock={stock} salesData={salesData} expenses={expenses} />;
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

  // المقياس المالي (ERP Logic)
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const stockValue = stock.reduce((sum, s) => sum + (s.balance * s.price), 0);
    return { totalIncome, totalExpenses, stockValue, cashBalance: totalIncome - totalExpenses };
  }, [salesData, expenses, stock]);

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>الرئيسية</button>
        <button className={activePage === 'inventory' ? 'active' : ''} onClick={() => setActivePage('inventory')}>المخزن</button>
        <button className={activePage === 'purchases' ? 'active' : ''} onClick={() => setActivePage('purchases')}>العمليات</button>
        <button className={activePage === 'reports' ? 'active' : ''} onClick={() => setActivePage('reports')}>التقارير</button>
      </nav>
    </div>
  );
};

export default App;
