import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Table as TableIcon, LayoutGrid, Trash2, Package, Archive, Layers, Activity, AlertTriangle } from 'lucide-react';
import { CapacitorHttp } from '@capacitor/core';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, onUpdateItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // حساب الرصيد الفعلي الإجمالي (مجموع الكميات)
  const totalActualStock = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
  }, [gridData]);

  // دالة إنشاء صف فارغ بالهيكل الجديد
  const createEmptyRow = () => ({
    id: `new-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    date: new Date().toISOString().split('T')[0],
    unit: '', // إضافة الوحدة
    balance: '', // الكمية
    price: '', // سعر الوحدة
    total: 0, // الإجمالي المحسوب
    isNew: true
  });

  // مزامنة التنبيهات عند تغيير البيانات
  useEffect(() => {
    const lowStockItems = gridData.filter(item => 
      item.name && item.balance !== '' && parseFloat(item.balance) < 5
    );
    setAlerts(lowStockItems);
  }, [gridData]);

  // معالجة البيانات القادمة من App.jsx وتحويلها لهيكل الجدول
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw' 
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
    
    const initialRows = filtered.map(cat => ({
      id: cat.id,
      name: cat.name || '',
      date: cat.date || new Date().toISOString().split('T')[0],
      unit: cat.unit || '',
      balance: cat.balance || '',
      price: cat.price || '',
      total: (parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0),
      isNew: false
    }));

    if (activeTab === 'raw') {
      setGridData([...initialRows, ...Array(5).fill(null).map(createEmptyRow)]);
    } else {
      setGridData(initialRows);
    }
  }, [activeTab, categories]);

  // دالة تغيير الخلايا مع حساب الإجمالي آلياً وتمرير البيانات لـ App.jsx
  const handleCellChange = (id, field, value) => {
    setGridData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // حساب السعر المجمل آلياً إذا تغيرت الكمية أو السعر
        if (field === 'balance' || field === 'price') {
          const b = field === 'balance' ? parseFloat(value) : parseFloat(item.balance);
          const p = field === 'price' ? parseFloat(value) : parseFloat(item.price);
          updatedItem.total = (b || 0) * (p || 0);
        }

        // إرسال التحديث لـ App.jsx فوراً
        if (onUpdateItem) onUpdateItem(updatedItem);
        return updatedItem;
      }
      return item;
    }));
  };

  // دالة الحذف المرتبطة بـ App.jsx
  const handleDeleteProcess = async (id, isNew) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصنف نهائياً؟")) {
      try {
        // 1. تمرير عملية الحذف لـ App.jsx ليقوم بالحذف من السيرفر/الحالة الرئيسية
        if (onDeleteItem) {
          await onDeleteItem(id); 
        }

        // 2. تحديث الواجهة المحلية
        setGridData(prev => prev.filter(item => item.id !== id));

        console.log("تمت عملية الحذف بنجاح وتمريرها لـ App.jsx");
      } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("حدث خطأ أثناء الحذف.");
      }
    }
  };

  const extendSheet = () => {
    setGridData(prev => [...prev, ...Array(5).fill(null).map(createEmptyRow)]);
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f1f5f9', paddingBottom: '120px' }}>
      
      {/* التنبيهات */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff1f2', borderRight: '5px solid #ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <marquee style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>
            تنبيه نقص مخزن: {alerts.map(a => `${a.name} (${a.balance})`).join(' | ')} - يرجى طلب توريد فوري!
          </marquee>
        </div>
      )}

      {/* الرأس */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '12px', borderRadius: '15px' }}>
              {activeTab === 'raw' ? <FileSpreadsheet size={24} /> : <Package size={24} />}
           </div>
           <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
                {activeTab === 'raw' ? 'مخزن المواد الخام' : 'طلبيات المنتج النهائي'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                <Activity size={14} color="#1e5631" />
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e5631' }}>
                  الرصيد الفعلي: {totalActualStock.toLocaleString()}
                </span>
              </div>
           </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={22} color="#1e293b" />
        </button>
      </div>

      {/* التبديل بين الأقسام */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold' }}>
          <Layers size={18} style={{marginLeft: '8px', verticalAlign: 'middle'}} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold' }}>
          <Archive size={18} style={{marginLeft: '8px', verticalAlign: 'middle'}} /> المنتج النهائي
        </button>
      </div>

      {/* جدول الإكسل المطور */}
      {viewMode === 'table' ? (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', width: '40px' }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>الصنف</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الوحدة</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>السعر</th>
                  <th style={{ padding: '12px', textAlign: 'center', background: '#f0fdf4' }}>الإجمالي</th>
                  <th style={{ padding: '12px', width: '50px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem' }}>{index + 1}</td>
                    <td>
                      <input value={item.name} onChange={(e) => handleCellChange(item.id, 'name', e.target.value)} style={{ width: '100%', border: 'none', padding: '10px', outline: 'none', background: 'transparent' }} placeholder="اسم الصنف..." />
                    </td>
                    <td>
                      <input value={item.unit} onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', outline: 'none' }} placeholder="كجم/حبة" />
                    </td>
                    <td>
                      <input type="number" value={item.balance} onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', outline: 'none', fontWeight: 'bold', color: '#1e5631' }} placeholder="0" />
                    </td>
                    <td>
                      <input type="number" value={item.price} onChange={(e) => handleCellChange(item.id, 'price', e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', outline: 'none' }} placeholder="0" />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '900', color: '#166534', background: '#f8fafc' }}>
                      {(item.total || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleDeleteProcess(item.id, item.isNew)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={extendSheet} style={{ width: '100%', padding: '15px', background: '#fff', border: 'none', color: '#1e5631', fontWeight: 'bold', borderTop: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> إضافة صفوف إضافية
          </button>
        </div>
      ) : (
        /* عرض الكروت البصري */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {gridData.filter(i => i.name).map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: '22px', padding: '20px', borderBottom: `5px solid #1e5631`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontWeight: '900', fontSize: '1rem' }}>{item.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.unit}</div>
              <div style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '10px', fontSize: '0.85rem', color: '#1e5631', fontWeight: 'bold', marginTop: '8px' }}>
                الرصيد: {item.balance}
              </div>
              <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#166534' }}>إجمالي: {item.total}</div>
            </div>
          ))}
        </div>
      )}

      {/* زر المزامنة النهائي */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', padding: '20px', background: 'linear-gradient(to top, #f1f5f9 80%, transparent)', zIndex: 100 }}>
        <button onClick={() => alert("تمت المزامنة مع App.jsx بنجاح")} style={{ width: '100%', background: '#1e5631', color: '#fff', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 20px rgba(30,86,49,0.3)' }}>
          <Archive size={20} /> حفظ واعتماد البيانات ✅
        </button>
      </div>
    </div>
  );
};

export default Inventory;
