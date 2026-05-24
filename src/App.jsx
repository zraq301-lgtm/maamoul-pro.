import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { CapacitorHttp } from '@capacitor/core';
import apiService from './services/db'; 
import { PurchaseService } from './services/PurchaseService';

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

const showSwal = (title, icon = 'success') => {
  Swal.fire({ title, icon, timer: 1800, showConfirmButton: false, position: 'center', toast: true });
};

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

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

  const setters = useMemo(() => ({
    stock: setStock, salesData: setSalesData, inventory: setInventory,
    expenses: setExpenses, waste: setWaste, suppliers: setSuppliers,
    customers: setCustomers, productionData: setProductionData,
    waitingList: setSupplierWaitingList, cashBook: setCashBook, staff: setStaff
  }), []);

  const saveLocally = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const downloadDataFromMaamoulCloud = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      await apiService.syncAllModules(setters);
      setIsInitialLoading(false);
    } catch (err) {
      console.error("خطأ في المزامنة:", err);
      setIsInitialLoading(false);
    }
  }, [setters]);

  useEffect(() => {
    downloadDataFromMaamoulCloud();
  }, [downloadDataFromMaamoulCloud]);

  const handleSavePurchase = async (p) => {
    try {
      await PurchaseService.createPurchaseOrder("DEFAULT_TENANT", p);
      setInventory(prev => { const next = [...prev, p]; saveLocally('inventory', next); return next; });
      showSwal('تم حفظ المادة وتحديث المخزن');
    } catch (err) {
      showSwal('خطأ في الاتصال بالسيرفر', 'error');
    }
  };

  const renderPage = () => {
    const props = { 
      onBack: () => setActivePage('dashboard'), 
      stock, inventory, salesData, expenses, waste, suppliers, customers, staff, cashBook, supplierWaitingList, productionData,
      setStock, setInventory, setSalesData, setExpenses, setWaste, setSuppliers, setCustomers, setStaff, setCashBook, setProductionData,
      onDeleteItem: (itemId, moduleKey) => console.log("Delete triggered")
    };
    
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={{}} stock={stock} />;
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
      default: return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {[
          { id: 'dashboard', label: 'الرئيسية' },
          { id: 'Inventory', label: 'المخزن' },
          { id: 'PurchasesManager', label: 'المشتريات' },
          { id: 'Sales', label: 'المبيعات' },
          { id: 'Reports', label: 'التقارير' }
        ].map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
