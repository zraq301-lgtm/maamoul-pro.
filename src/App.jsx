import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { CapacitorHttp, Capacitor } from '@capacitor/core';

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

// --- إعدادات مستودع Nawah AI-DB ---
const DB_CONFIG = {
  owner: 'zraq301-lgtm',
  repo: 'Nawah-AI-db',
  token: 'ghp_YOUR_ACTUAL_TOKEN_HERE', // ضع التوكن الخاص بك هنا
  tenant: 'nawah-core'
};

const showSwal = (title, icon = 'success') => {
  Swal.fire({ title, icon, timer: 1800, showConfirmButton: false, position: 'center', toast: true });
};

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  // --- المحرك الجديد للارسال إلى Nawah AI-DB (GitHub) ---
  const syncWithNawahDB = async (collectionName, data) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return;

    try {
      const fileName = `${collectionName}_data.json`;
      const path = `database/${DB_CONFIG.tenant}/${collectionName}/${fileName}`;
      
      // تحويل البيانات لـ Base64 لكي يقبلها GitHub API
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

      const url = `https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${path}`;
      
      // جلب الـ SHA للملف إذا كان موجوداً لتحديثه (Update) بدلاً من إنشاء جديد فقط
      let sha = null;
      try {
        const getRes = await CapacitorHttp.get({ url, headers: { 'Authorization': `token ${DB_CONFIG.token}` } });
        if (getRes.status === 200) sha = getRes.data.sha;
      } catch (e) { /* ملف جديد */ }

      // تنفيذ عملية الرفع (PUT)
      await CapacitorHttp.put({
        url,
        headers: {
          'Authorization': `token ${DB_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          message: `Sync ${collectionName} from Maamoul App`,
          content: content,
          sha: sha // ضروري لتحديث الملفات الموجودة
        }
      });
      console.log(`Synced ${collectionName} to Nawah DB`);
    } catch (error) {
      console.error("Nawah Sync Error:", error);
    }
  };

  // --- States ---
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

  // تحديث المزامنة عند تغيير أي حالة (States)
  useEffect(() => {
    const syncMap = { stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, waitingList: supplierWaitingList, cashBook, staff };
    Object.entries(syncMap).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
      syncWithNawahDB(key, val); // المزامنة مع مستودع Nawah
    });
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff]);

  // --- Financial Logic (Calculated Stats) ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExp + totalPurchasesCash);
    return { totalIncome, totalExpenses: totalExp, cashBalance, netProfit: totalIncome - totalExp - totalPurchasesCash };
  }, [salesData, expenses, inventory]);

  // --- Handlers (نفس منطق الحفظ الداخلي الخاص بك مع ربطه بالمزامنة) ---
  const handleSavePurchase = (p) => {
    setInventory(prev => [...prev, p]);
    setStock(prev => {
      const idx = prev.findIndex(s => s.name === p.item);
      if (idx > -1) {
        const up = [...prev];
        up[idx] = { ...up[idx], balance: (up[idx].balance || 0) + parseFloat(p.quantity || 0) };
        return up;
      }
      return [...prev, { id: Date.now(), name: p.item, balance: parseFloat(p.quantity), price: p.price }];
    });
    showSwal('تم الحفظ في Nawah DB');
  };

  const renderPage = () => {
    const props = { onBack: () => setActivePage('dashboard') };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
      case 'inventory': return <Inventory {...props} categories={stock} onAddItem={handleSavePurchase} />;
      case 'production': return <ProductionManager {...props} stock={stock} onSaveProduction={(p) => setProductionData(prev => [...prev, p])} />;
      // ... باقي الصفحات تستدعي نفس الـ setters التي تطلق الـ useEffect للمزامنة
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {[{id:'dashboard', label:'الرئيسية'}, {id:'inventory', label:'المخزن'}, {id:'purchases', label:'العمليات'}, {id:'reports', label:'التقارير'}].map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
