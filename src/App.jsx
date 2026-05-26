import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CapacitorHttp } from '@capacitor/core';
import { createClient } from './utils/supabase/client.js'; // استيراد Supabase للتحكم في الخروج
import apiService from './services/db';
import { PurchaseService } from './services/PurchaseService';

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
  const supabase = createClient(); // تهيئة Supabase لاستخدامه في الخروج

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) {
      return initialValue;
    }
  };

  const [state, setState] = useState({
    stock: loadInitial('stock', []),
    salesData: loadInitial('salesData', []),
    inventory: loadInitial('inventory', []),
    expenses: loadInitial('expenses', []),
    waste: loadInitial('waste', []),
    suppliers: loadInitial('suppliers', []),
    customers: loadInitial('customers', []),
    productionData: loadInitial('productionData', []),
    cashBook: loadInitial('cashBook', []),
    staff: loadInitial('staff', [])
  });

  // محرك التحديث الذكي المعتمد على CapacitorHttp
  const updateModule = useCallback(async (moduleKey, newData) => {
    setState(prev => ({ ...prev, [moduleKey]: newData }));
    localStorage.setItem(moduleKey, JSON.stringify(newData));
    
    try {
      // الاتصال عبر CapacitorHttp للاندرويد
      await CapacitorHttp.post({
        url: 'https://maamoul-pro.vercel.app/api/sync', 
        headers: { 'Content-Type': 'application/json' },
        data: { moduleKey, data: newData }
      });
      // الاحتياط: المزامنة التقليدية إذا لزم الأمر
      await apiService.syncModule(moduleKey, newData);
    } catch (err) {
      console.error(`Sync failed for ${moduleKey}`, err);
    }
  }, []);

  // معالج المشتريات الذكي (يستخدم PurchaseService المعتمد على Capacitor)
  const handleSavePurchase = async (p) => {
    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      // استدعاء الخدمة (التي تستخدم CapacitorHttp داخلياً)
      await PurchaseService.createPurchaseOrder("DEFAULT_TENANT", p, idempotencyKey);
      
      const updatedInventory = [...state.inventory, p];
      await updateModule('inventory', updatedInventory);
      
      Swal.fire({ title: 'تم الحفظ بنجاح', icon: 'success', toast: true, position: 'top' });
    } catch (err) {
      console.error("Purchase Error:", err);
      Swal.fire('خطأ في الاتصال', 'تم الحفظ محلياً فقط. تأكد من اتصال الإنترنت.', 'error');
    }
  };

  // وظيفة تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; // إعادة توجيه المستخدم لصفحة الدخول
  };

  const renderPage = () => {
    const props = {
      data: state,
      onUpdate: updateModule,
      onBack: () => setActivePage('dashboard'),
      onSavePurchase: handleSavePurchase,
      onLogout: handleLogout // تمرير وظيفة الخروج للمكونات إذا احتجتها
    };

    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} setActivePage={setActivePage} />;
      case 'PurchasesManager': return <PurchasesManager {...props} onSave={handleSavePurchase} />;
      case 'Sales': return <Sales {...props} />;
      case 'Inventory': return <Inventory {...props} onSave={handleSavePurchase} />;
      case 'Waste': return <Waste {...props} />;
      case 'Expenses': return <Expenses {...props} />;
      case 'Suppliers': return <Suppliers {...props} />;
      case 'Financials': return <Financials {...props} />;
      case 'Reports': return <Reports {...props} />;
      case 'Customers': return <Customers {...props} />;
      case 'ProductionManager': return <ProductionManager {...props} />;
      case 'StaffManagement': return <StaffManagement {...props} />;
      case 'Settings': return <Settings {...props} />;
      default: return <Dashboard {...props} setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
