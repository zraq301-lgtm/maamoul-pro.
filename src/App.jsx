import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

// استيراد دالة الاتصال الموحدة والمؤمنة بمحرك v2
import { saveToNawahDB } from './services/db';

// استيراد المكونات المتوافقة مع ملفات النظام الفعلي
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
  const [syncStatus, setSyncStatus] = useState('مستقر');
  // 💡 متغير حماية لمنع مسح التخزين أثناء جلب البيانات من السحابة
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  // --- States لإدارة البيانات محلياً في الواجهة ---
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

  // 1. مزامنة البيانات وتحديث الحفظ المحلي (LocalStorage) - مع إضافة حماية مرحلة الإقلاع
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('stock', JSON.stringify(stock)); }, [stock, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('salesData', JSON.stringify(salesData)); }, [salesData, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('inventory', JSON.stringify(inventory)); }, [inventory, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('waste', JSON.stringify(waste)); }, [waste, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('customers', JSON.stringify(customers)); }, [customers, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('productionData', JSON.stringify(productionData)); }, [productionData, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('waitingList', JSON.stringify(supplierWaitingList)); }, [supplierWaitingList, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('cashBook', JSON.stringify(cashBook)); }, [cashBook, isInitialLoading]);
  useEffect(() => { if (!isInitialLoading) localStorage.setItem('staff', JSON.stringify(staff)); }, [staff, isInitialLoading]);

  // 2. 📥 محرك جلب واستعادة البيانات العكسي السحابي التلقائي الشامل
  useEffect(() => {
    const downloadDataFromNawahCloud = async () => {
      try {
        setSyncStatus('🔄 جاري فحص واستيراد بياناتك السحابية الآمنة...');
        
        const syncMap = [
          { key: 'stock', module: 'inventory', setter: setStock },
          { key: 'salesData', module: 'sales', setter: setSalesData },
          { key: 'inventory', module: 'purchases', setter: setInventory },
          { key: 'productionData', module: 'manufacturing', setter: setProductionData },
          { key: 'expenses', module: 'dashboard', setter: setExpenses }
        ];

        let importedCount = 0;

        for (const item of syncMap) {
          const response = await fetch(`https://nawah-ai-db.vercel.app/api/engine?module_name=${item.module}&record_id=${item.key}_records`, {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
          });

          if (response.ok) {
            const cloudRecords = await response.json();
            // التأكد من أن القادم مصفوفة تحتوي على بيانات فعلية وليس مصفوفة فارغة
            if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
              item.setter(cloudRecords); 
              localStorage.setItem(item.key, JSON.stringify(cloudRecords)); 
              importedCount++;
            }
          }
        }

        // إنهاء مرحلة الإقلاع بنجاح والسماح بالتحديث الدوري للـ localStorage
        setIsInitialLoading(false);

        if (importedCount > 0) {
          setSyncStatus('✅ تم استعادة كافة البيانات من nawah.ai بنجاح');
          showSwal('تمت استعادة بياناتك السحابية المشفرة!', 'success');
        } else {
          setSyncStatus('✅ قاعدة بيانات جديدة ونظيفة ومستقرة');
        }
      } catch (err) {
        console.error("🚨 Cloud Download Error:", err);
        setIsInitialLoading(false);
        setSyncStatus('⚠️ فشل سحب النسخة الاحتياطية السحابية');
      }
    };

    downloadDataFromNawahCloud();
  }, []);

  // 3. 📤 محرك المزامنة الخلفية المطور المسؤول عن رفع البيانات وتحديث السحابة دورياً
  useEffect(() => {
    // نمنع المزامنة والرفع التلقائي قبل اكتمال عملية السحب الأولى بالكامل
    if (isInitialLoading) return;

    const runBackgroundSyncToNawah = async () => {
      try {
        let hasDataToSync = false;
        let successCount = 0;

        const syncMap = [
          { key: 'stock', module: 'inventory' },
          { key: 'salesData', module: 'sales' },
          { key: 'inventory', module: 'purchases' },
          { key: 'productionData', module: 'manufacturing' },
          { key: 'expenses', module: 'dashboard' }
        ];

        for (const item of syncMap) {
          const localData = localStorage.getItem(item.key);
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hasDataToSync = true;
              setSyncStatus(`جاري تحديث السحابة لموديول ${item.key}...`);
              
              const res = await saveToNawahDB(item.module, `${item.key}_records`, parsed);
              if (res.success) successCount++;
            }
          }
        }

        if (!hasDataToSync) {
          setSyncStatus('✅ قاعدة البيانات السحابية متطابقة وثابتة');
        } else if (successCount > 0) {
          setSyncStatus('✅ nawah.ai مزامنة كاملة بنجاح 🔐');
        } else {
          setSyncStatus('⚠️ فشل التزامن المؤقت مع السيرفر');
        }
      } catch (err) {
        setSyncStatus('⚠️ خطأ اتصال بمستودع المحرك');
      }
    };

    // تبدأ المزامنة بعد 15 ثانية وتتكرر كل دقيقتين بشكل آمن ومستقر
    const initialTimer = setTimeout(runBackgroundSyncToNawah, 15000);
    const interval = setInterval(runBackgroundSyncToNawah, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [stock, salesData, inventory, productionData, expenses, isInitialLoading]);

  // --- العمليات والتحليلات الحسابية الكلية للوحة التحكم الشاملة ---
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

  // --- محرك عرض وإدارة الصفحات بالشاشات الجديدة والـ Props المتخصصة ---
  const renderPage = () => {
    const props = { onBack: () => setActivePage('dashboard'), stock, inventory, salesData, expenses, waste, suppliers, customers, staff, setStock };
    
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
      
      case 'PurchasesManager': 
        return <PurchasesManager {...props} onPurchaseComplete={handleSavePurchase} onOrderTrigger={(o) => setSupplierWaitingList(prev => [...prev, o])} />;
      
      case 'Sales': 
        return <Sales {...props} onSaveSales={(s) => setSalesData(prev => [...prev, s])} />;
      
      case 'ProductionManager': 
        return <ProductionManager {...props} onSaveProduction={(p) => setProductionData(prev => [...prev, p])} />;
      
      case 'Inventory': 
        return <Inventory {...props} categories={stock} onAddItem={handleSavePurchase} />;
      
      case 'Waste': 
        return <Waste {...props} onSaveWaste={(w) => setWaste(prev => [...prev, w])} />;
      
      case 'Expenses': 
        return <Expenses {...props} onSave={(e) => setExpenses(prev => [...prev, e])} />;
      
      case 'Suppliers': 
        return <Suppliers {...props} onSaveSupplier={(sup) => setSuppliers(prev => [...prev, sup])} />;
      
      case 'Financials': 
        return <Financials {...props} stats={financialStats} cashBook={cashBook} />;
      
      case 'Reports': 
        return <Reports {...props} productionHistory={productionData} stats={financialStats} />;
      
      case 'Customers': 
        return <Customers {...props} onSaveCustomer={(c) => setCustomers(prev => [...prev, c])} />;
      
      case 'StaffManagement': 
        return <StaffManagement {...props} onUpdateStaff={(st) => setStaff(st)} />;
      
      case 'Settings': 
        return <Settings {...props} />;
      
      default: 
        return <Dashboard setActivePage={setActivePage} stats={financialStats} staffCount={staff.length} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      {/* البار العلوي لحالة التزامن لمحرك nawah.ai */}
      <div style={{ background: '#0f172a', color: '#0ea5e9', fontSize: '11px', padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid rgba(14, 165, 233, 0.15)' }}>
        🤖 nawah.ai Cloud Engine Status: {syncStatus}
      </div>

      <main className="main-content">{renderPage()}</main>

      {/* البار السفلي الذكي للتنقل المباشر والسلس */}
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
