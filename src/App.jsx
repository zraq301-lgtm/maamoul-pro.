import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';

// استيراد أداة الاتصال الأصلية للهواتف الذكية من كاباسيتور
import { CapacitorHttp } from '@capacitor/core';

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

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState('مستقر');
  // 💡 متغير حماية لمنع تصفير أو الكتابة فوق البيانات المحلية أثناء جلب البيانات من السحابة عند الإقلاع
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  // 1. مزامنة البيانات وتحديث الحفظ المحلي (LocalStorage) - مع حماية مرحلة الإقلاع والسحب
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

  // 2. 📥 محرك الجلب والتوزيع الذكي والدقيق للبيانات السحابية المتوافق مع بنية المستودع المباشرة المقروءة بنجاح
  useEffect(() => {
    const downloadDataFromNawahCloud = async () => {
      try {
        setSyncStatus('🔄 جاري استيراد وتوطين البيانات السحابية الحية في الجداول...');
        
        // ربط الـ keys السابقة بأسماء مجلدات الموديولات الفعلية داخل مستودع قاعدة البيانات السحابية
        const syncMap = [
          { key: 'stock', module: 'inventory_module', setter: setStock },
          { key: 'salesData', module: 'sales_module', setter: setSalesData },
          { key: 'inventory', module: 'purchases_module', setter: setInventory },
          { key: 'productionData', module: 'manufacturing_module', setter: setProductionData },
          { key: 'expenses', module: 'dashboard_module', setter: setExpenses }
        ];

        let importedCount = 0;

        for (const item of syncMap) {
          const options = {
            // كسر حظر الكاش المؤقت على أجهزة الأندرويد لضمان ضخ مصفوفات نقية متزامنة مع المتصفح
            url: `https://nawah-ai-db.vercel.app/api/get-engine-data?t=${new Date().getTime()}`,
            method: 'GET',
            headers: { 
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Accept': 'application/json'
            },
            params: {
              module_name: item.module,
              record_id: `${item.key}_records`
            }
          };

          const response = await CapacitorHttp.get(options);

          if (response.status === 200 && response.data) {
            let cloudRecords = response.data;
            
            // معالجة قيود Capacitor البرمجية في فك تشفير النصوص العائدة تلقائياً
            if (typeof cloudRecords === 'string') {
              try {
                cloudRecords = JSON.parse(cloudRecords);
              } catch (e) {
                console.error("🚨 خطأ فك جمود بنية الموديول: " + item.key, e);
              }
            }

            // فك تغليف المصفوفات إذا تم إرسالها مدمجة داخل كائن استجابة فرعي
            if (cloudRecords && typeof cloudRecords === 'object' && !Array.isArray(cloudRecords)) {
              cloudRecords = cloudRecords.data || cloudRecords.payload || cloudRecords.records || Object.values(cloudRecords)[0] || [];
            }

            // التثبيت الفعلي للمصفوفة في الذاكرة والـ State والواجهات البرمجية المقابلة لها
            if (Array.isArray(cloudRecords) && cloudRecords.length > 0) {
              item.setter(cloudRecords); 
              localStorage.setItem(item.key, JSON.stringify(cloudRecords)); 
              importedCount++;
            }
          }
        }

        setIsInitialLoading(false);

        if (importedCount > 0) {
          setSyncStatus('✅ تم ضخ وتحديث كافة موديولات ERP بنجاح 🚀');
          showSwal('تمت استعادة مصفوفاتك السحابية الحية بنجاح!', 'success');
        } else {
          setSyncStatus('✅ السحابة مستقرة وجاهزة لتلقي العمليات الحسابية');
        }
      } catch (err) {
        console.error("🚨 Cloud Download & ERP Distribution Error:", err);
        setIsInitialLoading(false);
        setSyncStatus('⚠️ خطأ أثناء توزيع وتوطين البيانات السحابية');
      }
    };

    downloadDataFromNawahCloud();
  }, []);

  // 3. 📤 محرك المزامنة الخلفية المطور كلياً - الرفع المباشر لرابط الحفظ الجديد المستقر المعتمد
  useEffect(() => {
    if (isInitialLoading) return;

    const runBackgroundSyncToNawah = async () => {
      try {
        let hasDataToSync = false;
        let successCount = 0;

        const syncMap = [
          { key: 'stock', module: 'inventory_module' },
          { key: 'salesData', module: 'sales_module' },
          { key: 'inventory', module: 'purchases_module' },
          { key: 'productionData', module: 'manufacturing_module' },
          { key: 'expenses', module: 'dashboard_module' }
        ];

        for (const item of syncMap) {
          const localData = localStorage.getItem(item.key);
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hasDataToSync = true;
              setSyncStatus(`جاري مزامنة وحفظ موديول ${item.key} سحابياً...`);
              
              // 🎯 كود الرفع والحفظ الذكي الصارم الموجه مباشرة لرابط الـ Engine الجديد المعتمد
              const saveOptions = {
                url: 'https://nawah-ai-db.vercel.app/api/engine',
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                data: {
                  module_name: item.module,
                  record_id: `${item.key}_records`,
                  jsondata: parsed  // إرسال المصفوفة الحية الصافية لتحديث المستودع فوراُ
                }
              };

              const response = await CapacitorHttp.post(saveOptions);
              
              if (response.status === 200 || response.status === 201) {
                successCount++;
              }
            }
          }
        }

        if (!hasDataToSync) {
          setSyncStatus('✅ قاعدة البيانات متطابقة وثابتة محلياً وسحابياً');
        } else if (successCount > 0) {
          setSyncStatus('✅ تم تأمين وحفظ البيانات برابط المحرك بنجاح 🔐');
        } else {
          setSyncStatus('⚠️ فشل التزامن المؤقت مع سيرفر الحفظ الجديد');
        }
      } catch (err) {
        console.error("🚨 Cloud Save & ERP Sync Error:", err);
        setSyncStatus('⚠️ خطأ اتصال بمستودع محرك الحفظ الجديد');
      }
    };

    // ضبط مؤقتات المزامنة الدورية الخلفية الذكية لعدم تعطيل أداء الواجهات في الهاتف
    const initialTimer = setTimeout(runBackgroundSyncToNawah, 15000);
    const interval = setInterval(runBackgroundSyncToNawah, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [stock, salesData, inventory, productionData, expenses, isInitialLoading]);

  // --- العمليات والتحليلات الحسابية الكلية للوحة التحكم الشاملة لنظام Maamoul ---
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

  // --- محرك عرض وإدارة الصفحات بالشاشات والـ Props المتخصصة ---
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
      {/* البار العلوي الذكي لمراقبة حالة الاتصال والربط السحابي لـ nawah.ai */}
      <div style={{ background: '#0f172a', color: '#0ea5e9', fontSize: '11px', padding: '6px 10px', textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid rgba(14, 165, 233, 0.15)' }}>
        🤖 nawah.ai Cloud Engine Status: {syncStatus}
      </div>

      <main className="main-content">{renderPage()}</main>

      {/* البار السفلي الذكي للتنقل المباشر والسلس المناسب لاستخدام الهواتف بيد واحدة */}
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
