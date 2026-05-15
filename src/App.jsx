import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { CapacitorHttp } from '@capacitor/core';

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

// --- إعدادات مستودع Nawah AI-DB ---
const DB_CONFIG = {
  owner: 'zraq301-lgtm',
  repo: 'Nawah-AI-db',
  token: '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', 
  tenant: 'nawah-core'
};

const showSwal = (title, icon = 'success') => {
  Swal.fire({ title, icon, timer: 1800, showConfirmButton: false, position: 'center', toast: true });
};

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState('مستقر');

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  const toBase64 = (str) => btoa(unescape(encodeURIComponent(str)));

  const mapDataToNawahSchema = (collectionName, data) => {
    if (!Array.isArray(data)) return data;
    return data.map(item => {
      switch (collectionName) {
        case 'inventory':
          return {
            id: item.id?.toString() || `INV-${Date.now()}`,
            date: item.date || new Date().toISOString(),
            vendorId: item.supplier || 'مورد عام',
            totalAmount: parseFloat(item.total || 0),
            status: 'completed',
            items: item.items || [{
              productId: item.item,
              name: item.item,
              quantity: parseFloat(item.quantity || 0),
              unitPrice: parseFloat(item.price || 0),
              total: parseFloat(item.total || 0)
            }]
          };
        case 'stock':
          return {
            id: item.id?.toString() || item.name,
            name: item.name,
            sku: item.sku || `SKU-${item.name}`,
            stock: parseFloat(item.balance || 0),
            price: parseFloat(item.price || 0),
            category: item.category || 'عام'
          };
        case 'salesData':
          return {
            id: item.id?.toString() || `SAL-${Date.now()}`,
            date: item.date || new Date().toISOString(),
            customerId: item.customer || 'عميل نقدي',
            totalAmount: parseFloat(item.total || 0),
            status: 'completed',
            items: item.items || []
          };
        default:
          return item;
      }
    });
  };

  const syncWithNawahDB = async (collectionName, rawData) => {
    if (!rawData || rawData.length === 0) return;
    try {
      const formattedData = mapDataToNawahSchema(collectionName, rawData);
      const remoteNames = { inventory: 'purchase_orders', stock: 'products', salesData: 'sales_orders', productionData: 'manufacturing_orders', expenses: 'ledger' };
      const folderName = remoteNames[collectionName] || collectionName;
      const path = `database/${DB_CONFIG.tenant}/${folderName}/${folderName}.json`;
      const url = `https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${path}`;
      
      let sha = null;
      try {
        const getRes = await CapacitorHttp.get({ url, headers: { 'Authorization': `token ${DB_CONFIG.token}`, 'Cache-Control': 'no-cache' } });
        if (getRes.status === 200) sha = getRes.data.sha;
      } catch (e) {}

      await CapacitorHttp.put({
        url,
        headers: { 'Authorization': `token ${DB_CONFIG.token}`, 'Content-Type': 'application/json' },
        data: { message: `Automated Background Sync`, content: toBase64(JSON.stringify(formattedData, null, 2)), sha: sha }
      });
    } catch (error) {
      console.error("❌ Sync Error", error);
    }
  };

  // --- States ---
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

  // 1. مزامنة البيانات محلياً (منفصلة ومستقرة تماماً وبلا أي ثقل)
  useEffect(() => { localStorage.setItem('stock', JSON.stringify(stock)); }, [stock]);
  useEffect(() => { localStorage.setItem('salesData', JSON.stringify(salesData)); }, [salesData]);
  useEffect(() => { localStorage.setItem('inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('waste', JSON.stringify(waste)); }, [waste]);
  useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('productionData', JSON.stringify(productionData)); }, [productionData]);
  useEffect(() => { localStorage.setItem('waitingList', JSON.stringify(supplierWaitingList)); }, [supplierWaitingList]);
  useEffect(() => { localStorage.setItem('cashBook', JSON.stringify(cashBook)); }, [cashBook]);
  useEffect(() => { localStorage.setItem('staff', JSON.stringify(staff)); }, [staff]);

  // 2. [إغلاق الثغرة الحاسم]: مصفوفة مراقبة فارغة لمنع الـ Loops اللانهائية نهائياً
  useEffect(() => {
    const runBackgroundSync = async () => {
      try {
        setSyncStatus('جاري المزامنة السحابية...');
        
        // جلب أحدث البيانات مباشرة من الـ LocalStorage لضمان عدم الاعتماد على الـ State المتقلب أثناء الـ Loop
        const syncKeys = ['stock', 'salesData', 'inventory', 'expenses', 'waste', 'suppliers', 'customers', 'productionData', 'waitingList', 'cashBook', 'staff'];
        
        for (const key of syncKeys) {
          const localData = localStorage.getItem(key);
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // تعديل مسمى المفتاح الخارجي ليتوافق مع قاعدة بيانات نواة
              const collectionName = key === 'waitingList' ? 'supplierWaitingList' : key;
              await syncWithNawahDB(collectionName, parsed);
            }
          }
        }
        setSyncStatus('✅ سحابة مستقرة');
      } catch (err) {
        setSyncStatus('⚠️ خطأ اتصال');
      }
    };

    // وقت انتظار آمن (10 ثوانٍ) لمنع أي تداخل أثناء فتح التطبيق
    const initialTimer = setTimeout(runBackgroundSync, 10000);
    // تكرار دوري مريح كل 60 ثانية لتوفير المعالج والبطارية
    const interval = setInterval(runBackgroundSync, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []); // 🌟 الحماية هنا: مصفوفة فارغة تعني التشغيل مرة واحدة فقط وجدولة الخلفية بأمان!

  // --- Financial Logic ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalPurchasesCash = inventory.filter(p => p.paymentMethod === 'كاش').reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
    const cashBalance = totalIncome - (totalExp + totalPurchasesCash);
    return { totalIncome, totalExpenses: totalExp, cashBalance, netProfit: totalIncome - totalExp - totalPurchasesCash };
  }, [salesData, expenses, inventory]);

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
    showSwal('تم حفظ الفاتورة محلياً وسيتم مزامنتها خلفياً');
  };

  const renderPage = () => {
    const props = { onBack: () => setActivePage('dashboard'), stock, inventory, salesData };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} productionHistory={productionData} stock={stock} />;
      case 'inventory': return <Inventory {...props} categories={stock} onAddItem={handleSavePurchase} />;
      case 'purchases': return <PurchasesManager {...props} onPurchaseComplete={handleSavePurchase} onOrderTrigger={(o) => setSupplierWaitingList(prev => [...prev, o])} />;
      case 'sales': return <Sales {...props} onSaveSales={(s) => setSalesData(prev => [...prev, s])} />;
      case 'production': return <ProductionManager {...props} onSaveProduction={(p) => setProductionData(prev => [...prev, p])} />;
      case 'reports': return <Reports {...props} />;
      case 'expenses': return <Expenses {...props} onSave={(e) => setExpenses(prev => [...prev, e])} />;
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} productionHistory={productionData} stock={stock} />;
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      <div style={{ background: '#0f172a', color: '#38bdf8', fontSize: '11px', padding: '4px 10px', textAlign: 'center', fontWeight: 'bold' }}>
        حالة الاتصال السحابي: {syncStatus}
      </div>
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {[{id:'dashboard', label:'الرئيسية'}, {id:'inventory', label:'المخزن'}, {id:'purchases', label:'المشتريات'}, {id:'reports', label:'التقارير'}].map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
