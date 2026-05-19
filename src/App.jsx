import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

// استيراد أداة الاتصال الأصلية للهواتف الذكية من كاباسيتور
import { CapacitorHttp } from '@capacitor/core';

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

// مصفوفة الموديولات الشاملة لإدارة التخزين الفعلي وقاعدة البيانات السحابية لنظام معمول
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  // --- States لإدارة البيانات محلياً وعالمياً لنظام Maamoul ERP ---
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

  // تجميع الـ Setters لتسهيل استدعائها ديناميكياً عند المزامنة والتحميل السحابي
  const setters = useMemo(() => ({
    stock: setStock, salesData: setSalesData, inventory: setInventory,
    expenses: setExpenses, waste: setWaste, suppliers: setSuppliers,
    customers: setCustomers, productionData: setProductionData,
    waitingList: setSupplierWaitingList, cashBook: setCashBook, staff: setStaff
  }), []);

  // 1. التخزين المحلي الآمن والتلقائي فور حدوث أي تعديل في الـ States
  useEffect(() => {
    if (isInitialLoading) return;
    
    localStorage.setItem('stock', JSON.stringify(stock));
    localStorage.setItem('salesData', JSON.stringify(salesData));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('productionData', JSON.stringify(productionData));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('staff', JSON.stringify(staff));
    localStorage.setItem('waitingList', JSON.stringify(supplierWaitingList));
    localStorage.setItem('cashBook', JSON.stringify(cashBook));
    localStorage.setItem('waste', JSON.stringify(waste));
  }, [stock, salesData, inventory, expenses, waste, suppliers, customers, productionData, supplierWaitingList, cashBook, staff, isInitialLoading]);

  // دالة مزامنة موديول معين بشكل فوري عند الإضافة (Real-time Sync Event)
  const syncModuleToServer = async (moduleName, dataPayload) => {
    if (!dataPayload || dataPayload.length === 0) return;
    try {
      await CapacitorHttp.post({
        url: 'https://maamoul-pro-five.vercel.app/api/sync',
        headers: { 'Content-Type': 'application/json' },
        data: {
          collectionName: moduleName,
          data: dataPayload
        }
      });
    } catch (err) {
      console.error(`🚨 Failed instant sync for ${moduleName}:`, err);
    }
  };

  // 2. 📥 محرك الجلب والتنزيل الشامل عند فتح التطبيق (مقاوم لحذف التطبيق)
  useEffect(() => {
    const downloadDataFromMaamoulCloud = async () => {
      try {
        let importedCount = 0;

        for (const item of SYNC_MODULES) {
          const cloudUrl = `https://maamoul-pro-five.vercel.app/api/get-data?collectionName=${item.module}&t=${new Date().getTime()}`;

          const response = await CapacitorHttp.get({
            url: cloudUrl,
            headers: { 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            }
          });

          if (response.status === 200 && response.data) {
            let cloudRecords = response.data;
            
            if (typeof cloudRecords === 'string') {
              try { cloudRecords = JSON.parse(cloudRecords); } catch (e) { }
            }

            if (cloudRecords && typeof cloudRecords === 'object' && !Array.isArray(cloudRecords)) {
              cloudRecords = cloudRecords.data || cloudRecords.payload || cloudRecords.records || Object.values(cloudRecords)[0] || [];
            }

            if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
              if (setters[item.key]) {
                setters[item.key](cloudRecords);
                localStorage.setItem(item.key, JSON.stringify(cloudRecords)); 
                importedCount++;
              }
            }
          }
        }

        setIsInitialLoading(false);
        if (importedCount > 0) {
          showSwal('تم استعادة وتحديث كافة سجلات نظام معمول بنجاح!', 'success');
        }
      } catch (err) {
        console.error("🚨 Cloud Download Error:", err);
        setIsInitialLoading(false);
      }
    };

    downloadDataFromMaamoulCloud();
  }, [setters]);

  // 3. 📤 محرك المزامنة التلقائية الدورية كخط دفاع ثانٍ لحفظ البيانات غير المرفوعة
  useEffect(() => {
    if (isInitialLoading) return;

    const runBackgroundSyncToMaamoul = async () => {
      try {
        for (const item of SYNC_MODULES) {
          const localData = localStorage.getItem(item.key);
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await syncModuleToServer(item.module, parsed);
            }
          }
        }
      } catch (err) {
        console.error("🚨 Background Sync Error:", err);
      }
    };

    const initialTimer = setTimeout(runBackgroundSyncToMaamoul, 10000);
    const interval = setInterval(runBackgroundSyncToMaamoul, 60000); // مزامنة شاملة كل دقيقة

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isInitialLoading]);

  // 🎯 دالة الحذف السحابي الفوري من قاعدة البيانات
  const deleteCloudData = async (moduleName, id) => {
    try {
      const response = await CapacitorHttp.post({
        url: 'https://maamoul-pro-five.vercel.app/api/delete-item',
        headers: { 'Content-Type': 'application/json' },
        data: { collectionName: moduleName, id }
      });
      return response.status === 200;
    } catch (err) {
      console.error("🚨 Cloud Delete Error:", err);
      return false;
    }
  };

  // 🤖 محرك تقارير الذكاء الاصطناعي (raqqa-ai)
  const analyzeSystemPerformanceWithAI = async (analysisPrompt) => {
    try {
      const response = await CapacitorHttp.post({
        url: 'https://maamoul-pro-five.vercel.app/api/raqqa-ai',
        headers: { 'Content-Type': 'application/json' },
        data: {
          prompt: analysisPrompt,
          systemSnapshot: { financialStats, currentStockCount: stock.length }
        }
      });
      return response.data;
    } catch (err) {
      console.error("🚨 AI Engine Error:", err);
      return null;
    }
  };

  // --- إدارة الحسابات والعمليات الكلية التلقائية للوحة التحكم ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExp + totalPurchasesCash);
    const stockValue = stock.reduce((sum, item) => sum + ((parseFloat(item.balance) || 0) * (parseFloat(item.price) || 0)), 0);

    return { totalIncome, totalExpenses: totalExp, cashBalance, netProfit: totalIncome - totalExp - totalPurchasesCash, stockValue };
  }, [salesData, expenses, inventory, stock]);

  // --- دوال الحفظ الذكي الفوري من الشاشات الفرعية ومزامنتها مباشرة ---
  
  const handleSavePurchase = (p) => {
    const updatedInventory = [...inventory, p];
    setInventory(updatedInventory);
    syncModuleToServer('purchases_module', updatedInventory);

    setStock(prev => {
      const idx = prev.findIndex(s => s.name === p.item);
      let nextStock = [...prev];
      if (idx > -1) {
        nextStock[idx] = { ...nextStock[idx], balance: (nextStock[idx].balance || 0) + parseFloat(p.quantity || 0) };
      } else {
        nextStock.push({ id: Date.now(), name: p.item, balance: parseFloat(p.quantity), price: p.price });
      }
      syncModuleToServer('inventory_module', nextStock);
      return nextStock;
    });
  };

  const handleSaveSales = (s) => {
    const updatedSales = [...salesData, s];
    setSalesData(updatedSales);
    syncModuleToServer('sales_module', updatedSales);
  };

  const handleSaveProduction = (p) => {
    const updatedProd = [...productionData, p];
    setProductionData(updatedProd);
    syncModuleToServer('manufacturing_module', updatedProd);
  };

  const handleSaveExpense = (e) => {
    const updatedExp = [...expenses, e];
    setExpenses(updatedExp);
    syncModuleToServer('dashboard_module', updatedExp);
  };

  const handleSaveCustomer = (c) => {
    setCustomers(prev => {
      const updated = typeof c === 'function' ? c(prev) : [...prev, c];
      syncModuleToServer('customers_module', updated);
      return updated;
    });
  };

  const handleSaveSupplier = (sup) => {
    setSuppliers(prev => {
      const updated = typeof sup === 'function' ? sup(prev) : [...prev, sup];
      syncModuleToServer('suppliers_module', updated);
      return updated;
    });
  };

  const handleSaveStaff = (st) => {
    const updatedStaff = typeof st === 'function' ? st(staff) : st;
    setStaff(updatedStaff);
    syncModuleToServer('staff_module', updatedStaff);
  };

  const handleSaveWaste = (w) => {
    setWaste(prev => [...prev, w]);
  };

  // --- محرك عرض شاشات وموديولات نظام معمول الفعلي ---
  const renderPage = () => {
    const props = { 
      onBack: () => setActivePage('dashboard'), 
      stock, inventory, salesData, expenses, waste, suppliers, customers, staff,
      setStock, deleteCloudData, analyzeSystemPerformanceWithAI,
      onPurchaseComplete: handleSavePurchase,
      onSaveSales: handleSaveSales,
      onSaveProduction: handleSaveProduction,
      onSave: handleSaveExpense,
      onSaveCustomer: handleSaveCustomer,
      onSaveSupplier: handleSaveSupplier,
      onUpdateStaff: handleSaveStaff,
      onSaveWaste: handleSaveWaste
    };
    
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
      case 'PurchasesManager': return <PurchasesManager {...props} onOrderTrigger={(o) => setSupplierWaitingList(prev => [...prev, o])} />;
      case 'Sales': return <Sales {...props} />;
      case 'ProductionManager': return <ProductionManager {...props} />;
      case 'Inventory': return <Inventory {...props} categories={stock} onAddItem={handleSavePurchase} />;
      case 'Waste': return <Waste {...props} />;
      case 'Expenses': return <Expenses {...props} />;
      case 'Suppliers': return <Suppliers {...props} />;
      case 'Financials': return <Financials {...props} stats={financialStats} cashBook={cashBook} />;
      case 'Reports': return <Reports {...props} productionHistory={productionData} stats={financialStats} />;
      case 'Customers': return <Customers {...props} />;
      case 'StaffManagement': return <StaffManagement {...props} />;
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
