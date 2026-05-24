import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';

// استيراد أداة الاتصال الأصلية للهواتف الذكية من كاباسيتور
import { CapacitorHttp } from '@capacitor/core';

// استيراد الخدمات (التي تحتوي الآن على روابط الاتصال والمعالجة)
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

const showSwal = (title, icon = 'success') => {
  Swal.fire({ title, icon, timer: 1800, showConfirmButton: false, position: 'center', toast: true });
};

const SYNC_MODULES = [
  { key: 'stock', module: 'inventory_module' },
  { key: 'salesData', module: 'sales_module' },
  { key: 'inventory', module: 'purchases_module' },
  { key: 'productionData', module: 'manufacturing_module' },
  { key: 'expenses', module: 'dashboard_module' },
  { key: 'customers', module: 'customers_module' },
  { key: 'suppliers', module: 'suppliers_module' },
  { key: 'staff', module: 'staff_module' },
  { key: 'waste', module: 'waste_module' },
  { key: 'cashBook', module: 'financials_module' }
];

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // دالة المزامنة تستخدم الآن الخدمات المستوردة
  const downloadDataFromMaamoulCloud = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      // استخدام apiService لجلب البيانات
      await apiService.syncAllModules(setters);
      setIsInitialLoading(false);
      showSwal('تم تحديث البيانات بنجاح');
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
      // استخدام خدمة المشتريات الموحدة
      await PurchaseService.createPurchaseOrder("DEFAULT_TENANT", p);
      setInventory(prev => { const next = [...prev, p]; saveLocally('inventory', next); return next; });
      showSwal('تم حفظ المادة وتحديث المخزن');
    } catch (err) {
      showSwal('خطأ في الاتصال بالسيرفر', 'error');
    }
  };

  const handleSaveSaleAndSync = (newSale) => {
    setSalesData(prevSales => [...prevSales, newSale]);
    // منطق التحديث المحلي يبقى كما هو
    setStock(prevStock => {
      const updatedStock = prevStock.map(item => item.name === newSale.productName ? { ...item, balance: Math.max(0, (parseFloat(item.balance)||0) - (parseFloat(newSale.quantity)||0)) } : item);
      saveLocally('stock', updatedStock);
      return updatedStock;
    });
  };

  const renderPage = () => {
    const props = { 
      onBack: () => setActivePage('dashboard'), 
      stock, inventory, salesData, expenses, waste, suppliers, customers, staff, cashBook, supplierWaitingList,
      setStock, setInventory, setSalesData, setExpenses, setWaste, setSuppliers, setCustomers, setStaff, setCashBook,
      onDeleteItem: (itemId, moduleKey) => console.log("Delete triggered")
    };
    
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={{}} stock={stock} />;
      case 'PurchasesManager': return <PurchasesManager {...props} onSave={handleSavePurchase} />;
      case 'Sales': return <Sales {...props} onSaveSale={handleSaveSaleAndSync} />;
      case 'Inventory': return <Inventory {...props} onSave={handleSavePurchase} />;
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
