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

  const loadInitial = (key, initialValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) { return initialValue; }
  };

  // --- دالة تحويل النصوص العربية لـ Base64 بشكل صحيح لـ GitHub ---
  const toBase64 = (str) => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  // --- محول البيانات (Schema Mapper) لضمان ظهورها في الأدمن ---
  const mapDataToNawahSchema = (collectionName, data) => {
    if (!Array.isArray(data)) return data;
    return data.map(item => {
      switch (collectionName) {
        case 'inventory':
          return {
            id: item.id?.toString(),
            date: item.date || new Date().toISOString(),
            vendorId: item.supplier || item.vendorId || 'مورد عام',
            totalAmount: parseFloat(item.total || item.totalAmount || 0),
            paymentMethod: item.paymentMethod || 'كاش',
            status: 'completed',
            items: item.items || [{
              productId: item.item,
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.price),
              total: parseFloat(item.total)
            }]
          };
        case 'stock':
          return {
            id: item.id?.toString() || item.name,
            name: item.name,
            stock: parseFloat(item.balance || item.stock || 0),
            price: parseFloat(item.price || 0)
          };
        default: return item;
      }
    });
  };

  // --- محرك المزامنة مع نظام تشخيص الأخطاء ---
  const syncWithNawahDB = async (collectionName, rawData) => {
    if (!rawData || rawData.length === 0) return;

    // توحيد أسماء الملفات مع الأدمن
    const remoteNames = {
      inventory: 'purchase_orders',
      stock: 'products',
      salesData: 'sales_orders'
    };
    
    const folderName = remoteNames[collectionName] || collectionName;
    const path = `database/${DB_CONFIG.tenant}/${folderName}.json`;
    const url = `https://api.github.com/repos/${DB_CONFIG.owner}/${DB_CONFIG.repo}/contents/${path}`;

    try {
      const formattedData = mapDataToNawahSchema(collectionName, rawData);
      const content = toBase64(JSON.stringify(formattedData, null, 2));

      // 1. محاولة جلب SHA الملف
      let sha = null;
      const getRes = await CapacitorHttp.get({
        url,
        headers: { 'Authorization': `token ${DB_CONFIG.token}`, 'Cache-Control': 'no-cache' }
      });

      if (getRes.status === 200) {
        sha = getRes.data.sha;
      }

      // 2. إرسال البيانات (PUT)
      const putRes = await CapacitorHttp.put({
        url,
        headers: {
          'Authorization': `token ${DB_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          message: `Update ${folderName} from Mobile App`,
          content: content,
          sha: sha
        }
      });

      if (putRes.status === 200 || putRes.status === 201) {
        console.log(`✅ ${folderName} تم المزامنة بنجاح`);
      } else {
        console.error(`❌ فشل في GitHub: ${putRes.status}`, putRes.data);
      }
    } catch (error) {
      console.error(`🚨 خطأ اتصال في ${folderName}:`, error);
    }
  };

  // --- States ---
  const [stock, setStock] = useState(() => loadInitial('stock', []));
  const [salesData, setSalesData] = useState(() => loadInitial('salesData', []));
  const [inventory, setInventory] = useState(() => loadInitial('inventory', []));
  const [expenses, setExpenses] = useState(() => loadInitial('expenses', []));

  // --- المزامنة الآلية ---
  useEffect(() => {
    const timer = setTimeout(() => {
      // مزامنة المخزن والمشتريات فقط حالياً للتجربة
      syncWithNawahDB('stock', stock);
      syncWithNawahDB('inventory', inventory);
      
      localStorage.setItem('stock', JSON.stringify(stock));
      localStorage.setItem('inventory', JSON.stringify(inventory));
    }, 2000);
    return () => clearTimeout(timer);
  }, [stock, inventory]);

  // --- Financial Logic ---
  const financialStats = useMemo(() => {
    const totalIncome = salesData.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return { totalIncome, totalExpenses: totalExp, cashBalance: totalIncome - totalExp };
  }, [salesData, expenses]);

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
    showSwal('تم الحفظ والمزامنة');
  };

  const renderPage = () => {
    const props = { onBack: () => setActivePage('dashboard'), stock, inventory, salesData };
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
      case 'inventory': return <Inventory {...props} onAddItem={handleSavePurchase} />;
      case 'purchases': return <PurchasesManager {...props} onPurchaseComplete={handleSavePurchase} />;
      case 'reports': return <Reports {...props} />;
      default: return <Dashboard setActivePage={setActivePage} stats={financialStats} />;
    }
  };

  return (
    <div className="app-container" dir="rtl">
      <main className="main-content">{renderPage()}</main>
      <nav className="bottom-nav">
        {[{id:'dashboard', label:'الرئيسية'}, {id:'inventory', label:'المخزن'}, {id:'purchases', label:'المشتريات'}].map(item => (
          <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
