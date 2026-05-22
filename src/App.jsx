import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// مصفوفة الموديولات لإدارة التخزين المحلي والربط المتكامل - تم إضافة الموديولات الناقصة لضمان شمولية الحفظ
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

  // دالة مساعدة معالجة ومضمونة لتحميل البيانات محلياً فوراً لمنع ظهور شاشات بيضاء
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

  // دالة موحدة للحفظ المحلي الآمن لحماية البيانات من الاستبدال الفارغ
  const saveLocally = useCallback((key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  // 1. 📥 محرك جلب البيانات السحابي الآمن والمنظم
  const downloadDataFromMaamoulCloud = useCallback(async () => {
    try {
      let importedCount = 0;

      for (const item of SYNC_MODULES) {
        const cloudUrl = `https://maamoul-pro-five.vercel.app/api/get-data?module_name=${item.module}&record_id=${item.key}_records&t=${new Date().getTime()}`;

        const options = {
          url: cloudUrl,
          method: 'GET',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Accept': 'application/json'
          }
        };

        const response = await CapacitorHttp.get(options);

        if (response.status === 200 && response.data) {
          let cloudRecords = response.data;
          
          if (typeof cloudRecords === 'string') {
            try { cloudRecords = JSON.parse(cloudRecords); } catch (e) { console.error("🚨 خطأ موديول: " + item.key, e); }
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
        showSwal('تم استعادة وتحديث سجلات النظام بنجاح!', 'success');
      }
    } catch (err) {
      console.error("🚨 Cloud Download Error:", err);
      setIsInitialLoading(false);
    }
  }, [setters]);

  // تشغيل محرك الجلب الأساسي عند إقلاع التطبيق لأول مرة فقط
  useEffect(() => {
    downloadDataFromMaamoulCloud();
  }, [downloadDataFromMaamoulCloud]);

  // 2. 📤 محرك المزامنة الخلفية التلقائي والذكي المعدّل
  useEffect(() => {
    if (isInitialLoading) return;

    const runBackgroundSyncToMaamoul = async () => {
      setIsSyncing(true);
      try {
        const liveDataMap = {
          stock,
          salesData,
          inventory,
          productionData,
          expenses,
          customers,
          suppliers,
          staff,
          waste,
          cashBook
        };

        for (const item of SYNC_MODULES) {
          const currentLiveData = liveDataMap[item.key];
          
          if (Array.isArray(currentLiveData) && currentLiveData.length > 0) {
            const saveOptions = {
              url: 'https://maamoul-pro-five.vercel.app/api/sync',
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              data: {
                module_name: item.module,
                record_id: `${item.key}_records`,
                jsondata: currentLiveData  
              }
            };
            await CapacitorHttp.post(saveOptions);
          }
        }
      } catch (err) {
        console.error("🚨 Cloud Save Sync Error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    const initialTimer = setTimeout(runBackgroundSyncToMaamoul, 5000); // زيادة وقت البدء الأولي لتفادي تضارب الحفظ أول مرة
    const interval = setInterval(runBackgroundSyncToMaamoul, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [stock, salesData, inventory, productionData, expenses, customers, suppliers, staff, waste, cashBook, isInitialLoading]);

  // 🎯 دالة الحذف السحابية المعدلة لتجنب خطأ 400
  const deleteCloudData = async (moduleName, recordId) => {
    try {
      const deleteUrl = `https://maamoul-pro-five.vercel.app/api/delete-item?module_name=${moduleName}&record_id=${recordId}_records`;

      const options = {
        url: deleteUrl,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      };

      const response = await CapacitorHttp.delete(options);
      return response.status === 200;
    } catch (err) {
      console.error("🚨 Cloud Delete Error:", err);
      return false;
    }
  };

  // 🤖 دالة معالجة وتحليل الأداء والتقارير عبر محرك الذكاء الاصطناعي (raqqa-ai)
  const analyzeSystemPerformanceWithAI = async (analysisPrompt) => {
    try {
      const options = {
        url: 'https://maamoul-pro-five.vercel.app/api/raqqa-ai',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          prompt: analysisPrompt,
          systemSnapshot: { financialStats, currentStockCount: stock.length }
        }
      };
      const response = await CapacitorHttp.post(options);
      return response.data;
    } catch (err) {
      console.error("🚨 AI Engine Error:", err);
      return null;
    }
  };

  // --- العمليات والتحليلات الحسابية الكلية للوحة التحكم ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش' || p.paymentType === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExp + totalPurchasesCash);
    const stockValue = stock.reduce((sum, item) => sum + ((parseFloat(item.balance) || 0) * (parseFloat(item.price) || 0)), 0);

    return { totalIncome, totalExpenses: totalExp, cashBalance, netProfit: totalIncome - totalExp - totalPurchasesCash, stockValue };
  }, [salesData, expenses, inventory, stock]);

  // ==========================================
  // [ذكاء تصنيف ERP المضاف للمخزون القادم]
  // ==========================================
  const erpCategorizedStock = useMemo(() => {
    const items = stock || [];
    // فرز وتوزيع المنتجات الجاهزة والنهائية بناءً على الكلمة الدليلية والتصنيف الممرر من الإنتاج
    const finished = items.filter(item => {
      const name = (item.name || '').toString();
      const category = (item.category || '').toString();
      return name.includes('نهائي') || name.includes('جاهز') || category === 'منتجات';
    });
    // فرز وتوزيع المواد الخام (باقي العناصر التي لا تنطبق عليها شروط المنتجات النهائية)
    const raw = items.filter(item => {
      const name = (item.name || '').toString();
      const category = (item.category || '').toString();
      return !(name.includes('نهائي') || name.includes('جاهز') || category === 'منتجات');
    });
    
    return { finished, raw };
  }, [stock]);

  // دالة معالجة وحفظ المشتريات وتحديث المخزون الفوري محلياً وسحابياً
  const handleSavePurchase = (p) => {
    setInventory(prev => {
      const next = [...prev, p];
      saveLocally('inventory', next);
      return next;
    });

    setStock(prev => {
      const idx = prev.findIndex(s => s.name === p.item || s.name === p.itemName);
      let nextStock = [...prev];
      if (idx > -1) {
        nextStock[idx] = { ...nextStock[idx], balance: (nextStock[idx].balance || 0) + parseFloat(p.quantity || p.qty || 0) };
      } else {
        nextStock.push({ id: Date.now(), name: p.item || p.itemName, balance: parseFloat(p.quantity || p.qty || 0), price: parseFloat(p.price || 0) });
      }
      saveLocally('stock', nextStock);
      return nextStock;
    });
    showSwal('تم حفظ المادة وتحديث المخزن');
  };

  // حلقة الحفظ التلقائي في التخزين المحلي لكل الحالات
  useEffect(() => {
    if (isInitialLoading) return;
    saveLocally('stock', stock);
    saveLocally('salesData', salesData);
    saveLocally('inventory', inventory);
    saveLocally('productionData', productionData);
    saveLocally('expenses', expenses);
    saveLocally('customers', customers);
    saveLocally('suppliers', suppliers);
    saveLocally('staff', staff);
    saveLocally('waitingList', supplierWaitingList);
    saveLocally('cashBook', cashBook);
    saveLocally('waste', waste);
  }, [stock, salesData, inventory, productionData, expenses, customers, suppliers, staff, supplierWaitingList, cashBook, waste, isInitialLoading, saveLocally]);

  // --- محرك عرض الشاشات والواجهات الفرعية وتوزيع الـ Setters بشكل كامل لمنع الفقدان ---
  const renderPage = () => {
    const props = { 
      onBack: () => setActivePage('dashboard'), 
      stock, inventory, salesData, expenses, waste, suppliers, customers, staff, cashBook, supplierWaitingList,
      setStock, setInventory, setSalesData, setExpenses, setWaste, setSuppliers, setCustomers, setStaff, setCashBook,
      deleteCloudData, analyzeSystemPerformanceWithAI
    };
    
    switch (activePage) {
      case 'dashboard': 
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            stats={financialStats} 
            staffCount={staff.length} 
            productionHistory={productionData} // إرسال عمليات الإنتاج للعرض في جدول لوحة التحكم
            stock={stock}
            fetchData={downloadDataFromMaamoulCloud}
          />
        );
      
      case 'PurchasesManager': 
        return <PurchasesManager {...props} onSave={handleSavePurchase} onPurchaseComplete={handleSavePurchase} onOrderTrigger={(o) => setSupplierWaitingList(prev => [...prev, o])} />;
      
      case 'Sales': 
        return <Sales {...props} onSaveSales={(s) => setSalesData(prev => [...prev, s])} />;
      
      case 'ProductionManager': 
        return (
          <ProductionManager 
            {...props} 
            setStock={async (updatedStock) => {
              // 1. الخصم والتحديث المحلي الفوري الفعلي للمخزون ومنع عمليات الكتابة الفوقية العشوائية
              setStock(updatedStock);
              localStorage.setItem('stock', JSON.stringify(updatedStock));

              // 2. 🚀 مزامنة فورية وقسرية ومباشرة للمخزن المخصوم مع السيرفر السحابي لقتل التضارب في نفس اللحظة
              try {
                await CapacitorHttp.post({
                  url: 'https://maamoul-pro-five.vercel.app/api/sync',
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  data: {
                    module_name: 'inventory_module',
                    record_id: 'stock_records',
                    jsondata: updatedStock  
                  }
                });
              } catch (err) {
                console.error("🚨 خطأ تزامن المخزن الفوري:", err);
              }
            }}
            onSaveProduction={async (p) => {
              setProductionData(prev => {
                const nextProduction = [...prev, p];
                localStorage.setItem('productionData', JSON.stringify(nextProduction));

                // مزامنة فورية لسجل الإنتاج إلى السيرفر لقاعدة البيانات السحابية لمنع الاختفاء
                CapacitorHttp.post({
                  url: 'https://maamoul-pro-five.vercel.app/api/sync',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  data: {
                    module_name: 'manufacturing_module',
                    record_id: 'productionData_records',
                    jsondata: nextProduction
                  }
                });

                return nextProduction;
              });
            }} 
            onSaveWaste={async (w) => {
              setWaste(prev => {
                const nextWaste = [...prev, w];
                localStorage.setItem('waste', JSON.stringify(nextWaste));

                // مزامنة فورية للهالك إلى قاعدة البيانات السحابية لمنع الاختفاء
                CapacitorHttp.post({
                  url: 'https://maamoul-pro-five.vercel.app/api/sync',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  data: {
                    module_name: 'waste_module',
                    record_id: 'waste_records',
                    jsondata: nextWaste
                  }
                });

                return nextWaste;
              });
            }} 
          />
        );
      
      case 'Inventory': 
        // تمرير المنتجات المفروزة والمصنفة بذكاء ERO بدلاً من المخزن الشامل لحل مشكلة ظهور المواد الخام
        return <Inventory {...props} categories={erpCategorizedStock.finished} rawCategories={erpCategorizedStock.raw} onSave={handleSavePurchase} onAddItem={(item) => setStock(prev => [...prev, item])} />;
      
      case 'Waste': 
        return <Waste {...props} onSaveWaste={(w) => setWaste(prev => [...prev, w])} />;
      
      case 'Expenses': 
        return <Expenses {...props} onSave={(e) => setExpenses(prev => [...prev, e])} />;
      
      case 'Suppliers': 
        return <Suppliers {...props} onSaveSupplier={(sup) => setSuppliers(prev => (typeof sup === 'function' ? sup(prev) : [...prev, sup]))} />;
      
      case 'Financials': 
        return <Financials {...props} stats={financialStats} onSaveTransaction={(t) => setCashBook(prev => [...prev, t])} />;
      
      case 'Reports': 
        return <Reports {...props} productionHistory={productionData} stats={financialStats} />;
      
      case 'Customers': 
        return <Customers {...props} onSaveCustomer={(c) => setCustomers(prev => (typeof c === 'function' ? c(prev) : [...prev, c]))} />;
      
      case 'StaffManagement': 
        return <StaffManagement {...props} onUpdateStaff={(st) => setStaff(st)} />;
      
      case 'Settings': 
        return <Settings {...props} />;
      
      default: 
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            stats={financialStats} 
            staffCount={staff.length} 
            productionHistory={productionData} // إرسال عمليات الإنتاج للعرض في جدول لوحة التحكم الافتراضية
            stock={stock}
            fetchData={downloadDataFromMaamoulCloud}
          />
        );
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      {isSyncing && (
        <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 1000, fontSize: '10px', color: '#2563eb', background: '#fff', padding: '2px 8px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          🔄 جاري المزامنة مع السيرفر...
        </div>
      )}
      
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
