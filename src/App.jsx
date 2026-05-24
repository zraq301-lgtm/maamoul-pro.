import React, { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
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

  const updateModule = useCallback(async (moduleKey, newData) => {
    setState(prev => ({ ...prev, [moduleKey]: newData }));
    localStorage.setItem(moduleKey, JSON.stringify(newData));
    try {
      await apiService.syncModule(moduleKey, newData);
    } catch (err) {
      console.error(`Sync failed for ${moduleKey}`, err);
    }
  }, []);

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
    const props = {
      data: state,
      onUpdate: updateModule,
      onBack: () => setActivePage('dashboard')
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
      
      <nav className="bottom-nav">
        {[
          { id: 'dashboard', label: 'الرئيسية' },
          { id: 'Inventory', label: 'المخزن' },
          { id: 'PurchasesManager', label: 'المشتريات' },
          { id: 'Sales', label: 'المبيعات' },
          { id: 'Reports', label: 'التقارير' }
        ].map(item => (
          <button 
            key={item.id} 
            className={`nav-item ${activePage === item.id ? 'active' : ''}`} 
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
