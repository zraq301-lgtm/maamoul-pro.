import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

// استيراد الروابط والمحرك الموحد من المسار المطلوب
import apiService, { apiEndpoints } from './services/db';

// استيراد دالة تشغيل الاتصال الخارجي من المسار المطلوب
import { executeExternalConnection } from './services/db';

// استيراد المكونات المتوافقة مع ملفات النظام الفعلي لنظام Maamoul
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

// مصفوفة الموديولات لإدارة التخزين المحلي المتكامل لمنع تكرار الأسطر
const SYNC_MODULES = [
  { key: 'stock', module: 'inventory_module' },
  { key: 'salesData', module: 'sales_module' },
  { key: 'inventory', module: 'purchases_module' },
  { key: 'productionData', module: 'manufacturing_module' },
  { key: 'expenses', module: 'dashboard_module' },
  { key: 'customers', module: 'customers_module' },
  { key: 'suppliers', module: 'suppliers_module' },
  { key: 'staff', module: 'staff_module' }
];

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  // --- States لإدارة البيانات محلياً في الواجهة لمشروع Maamoul ERP ---
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

  // تجميع الـ Setters في كائن لتسهيل المزامنة الذكية الديناميكية
  const setters = useMemo(() => ({
    stock: setStock, salesData: setSalesData, inventory: setInventory,
    expenses: setExpenses, waste: setWaste, suppliers: setSuppliers,
    customers: setCustomers, productionData: setProductionData,
    waitingList: setSupplierWaitingList, cashBook: setCashBook, staff: setStaff
  }), []);

  // 1. إدارة الحفظ المحلي التلقائي والذكي بملف واحد متكامل لمنع تكرار الأسطر لكل موديول
  useEffect(() => {
    if (isInitialLoading) return;
    SYNC_MODULES.forEach(item => {
      const localValue = item.key === 'stock' ? stock :
                         item.key === 'salesData' ? salesData :
                         item.key === 'inventory' ? inventory :
                         item.key === 'productionData' ? productionData :
                         item.key === 'expenses' ? expenses :
                         item.key === 'customers' ? customers :
                         item.key === 'suppliers' ? suppliers : staff;
      localStorage.setItem(item.key, JSON.stringify(localValue));
    });
    localStorage.setItem('waitingList', JSON.stringify(supplierWaitingList));
    localStorage.setItem('cashBook', JSON.stringify(cashBook));
    localStorage.setItem('waste', JSON.stringify(waste));
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff, isInitialLoading]);

  // --- العمليات والتحليلات الحسابية الكلية للوحة التحكم ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExp + totalPurchasesCash);
    const stockValue = stock.reduce((sum, item) => sum + ((parseFloat(item.balance) || 0) * (parseFloat(item.price) || 0)), 0);

    return { totalIncome, totalExpenses: totalExp, cashBalance, netProfit: totalIncome - totalExp - totalPurchasesCash, stockValue };
  }, [salesData, expenses, inventory, stock]);

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
  };

  // --- محرك عرض الشاشات والواجهات الفرعية لتطبيق معمول ---
  const renderPage = () => {
    const props = { 
      onBack: () => setActivePage('dashboard'), 
      stock, inventory, salesData, expenses, waste, suppliers, customers, staff, setStock,
      setCustomers, setSuppliers, setStaff
    };
    
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
      case 'PurchasesManager': return <PurchasesManager {...props} onPurchaseComplete={handleSavePurchase} onOrderTrigger={(o) => setSupplierWaitingList(prev => [...prev, o])} />;
      case 'Sales': return <Sales {...props} onSaveSales={(s) => setSalesData(prev => [...prev, s])} />;
      case 'ProductionManager': return <ProductionManager {...props} onSaveProduction={(p) => setProductionData(prev => [...prev, p])} />;
      case 'Inventory': return <Inventory {...props} categories={stock} onAddItem={handleSavePurchase} />;
      case 'Waste': return <Waste {...props} onSaveWaste={(w) => setWaste(prev => [...prev, w])} />;
      case 'Expenses': return <Expenses {...props} onSave={(e) => setExpenses(prev => [...prev, e])} />;
      case 'Suppliers': return <Suppliers {...props} onSaveSupplier={(sup) => setSuppliers(prev => (typeof sup === 'function' ? sup(prev) : [...prev, sup]))} />;
      case 'Financials': return <Financials {...props} stats={financialStats} cashBook={cashBook} />;
      case 'Reports': return <Reports {...props} productionHistory={productionData} stats={financialStats} />;
      case 'Customers': return <Customers {...props} onSaveCustomer={(c) => setCustomers(prev => (typeof c === 'function' ? c(prev) : [...prev, c]))} />;
      case 'StaffManagement': return <StaffManagement {...props} onUpdateStaff={(st) => setStaff(st)} />;
      case 'Settings': return <Settings {...props} />;
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
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
