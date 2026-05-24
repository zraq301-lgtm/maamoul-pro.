import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import apiService from './services/db'; 
import { PurchaseService } from './services/PurchaseService';

// ... (باقي الاستيرادات للمكونات تبقى كما هي)

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  
  // دالة تحميل البيانات
  const loadInitial = (key, initialValue) => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : initialValue; } 
    catch (e) { return initialValue; }
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

  // المزامنة المركزية للأقسام
  const updateModule = useCallback(async (moduleKey, newData) => {
    // 1. تحديث الحالة المحلية
    setState(prev => ({ ...prev, [moduleKey]: newData }));
    // 2. التخزين المحلي
    localStorage.setItem(moduleKey, JSON.stringify(newData));
    // 3. المزامنة السحابية (اختياري حسب الموديول)
    try { await apiService.syncModule(moduleKey, newData); } 
    catch (err) { console.error(`Sync failed for ${moduleKey}`); }
  }, []);

  // دالة خاصة للمشتريات (تتعامل مع السيرفر والـ State)
  const handleSavePurchase = async (p) => {
    try {
      await PurchaseService.createPurchaseOrder("DEFAULT_TENANT", p);
      const updatedInventory = [...state.inventory, p];
      await updateModule('inventory', updatedInventory);
      Swal.fire({ title: 'تم الحفظ بنجاح', icon: 'success', toast: true, position: 'top' });
    } catch (err) {
      Swal.fire('خطأ في السيرفر', 'تم الحفظ محلياً فقط', 'error');
    }
  };

  const renderPage = () => {
    // تمرير البيانات ككائن واحد لتنظيم أفضل
    const props = { 
      data: state, 
      onUpdate: updateModule, // المكونات تستخدم هذه الدالة لتحديث بياناتها
      onBack: () => setActivePage('dashboard')
    };
    
    switch (activePage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'PurchasesManager': return <PurchasesManager {...props} onSave={handleSavePurchase} />;
      case 'Sales': return <Sales {...props} />;
      case 'Inventory': return <Inventory {...props} onSave={handleSavePurchase} />;
      // ... باقي الحالات
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {/* Navigation logic */}
      </nav>
    </div>
  );
};
