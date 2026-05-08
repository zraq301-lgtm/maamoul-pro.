import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Table as TableIcon, LayoutGrid, Trash2, Package, Archive, Layers, Activity, AlertTriangle, Bell } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // حساب الرصيد الإجمالي الفعلي للمخزن
  const totalActualStock = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
  }, [gridData]);

  // دالة إرسال إشعارات الأندرويد / النظام
  const sendSystemNotification = (title, body) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/logo.png" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  };

  // فحص مستويات المخزون وإصدار التنبيهات
  useEffect(() => {
    const lowStockItems = gridData.filter(item => 
      item.name && item.balance !== '' && parseFloat(item.balance) < 5
    );
    
    setAlerts(lowStockItems);

    if (lowStockItems.length > 0) {
      const lastItem = lowStockItems[lowStockItems.length - 1];
      sendSystemNotification("⚠️ تنبيه مخزن", `الصنف "${lastItem.name}" أوشك على النفاد!`);
    }
  }, [gridData]);

  const createEmptyRow = () => ({
    id: `new-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    date: new Date().toISOString().split('T')[0],
    balance: '',
    price: '',
    isNew: true
  });

  // دالة الحذف النهائية (قاعدة البيانات + الواجهة)
  const handleDeleteProcess = async (id, isNew) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصنف نهائياً؟")) {
      try {
        // 1. إذا لم يكن صفاً جديداً فارغاً، احذفه من قاعدة البيانات
        if (!isNew) {
          const response = await fetch('https://maamoul-pro-five.vercel.app/api/delete-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
          });

          if (!response.ok) throw new Error("فشل الحذف من الخادم");
        }

        // 2. تحديث الواجهة فوراً (React State)
        const updatedData = gridData.filter(item => item.id !== id);
        setGridData(updatedData);

        // 3. تحديث مصفوفة المخزن الأب (لضمان المزامنة مع App.js)
        if (onDeleteItem) {
          onDeleteItem(id);
        }

        console.log("تم الحذف بنجاح من قاعدة البيانات والمكتبة المحلية");
      } catch (error) {
        console.error("خطأ في الحذف:", error);
        alert("حدث خطأ أثناء الاتصال بقاعدة البيانات، تم الحذف من الشاشة فقط.");
        // حذف من الواجهة حتى لو فشل السيرفر لراحة المستخدم
        setGridData(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw' 
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
    
    const initialRows = filtered.map(cat => ({
      id: cat.id,
      name: cat.name || '',
      date: cat.date || new Date().toISOString().split('T')[0],
      balance: cat.balance || '',
      price: cat.price || '',
      isNew: false
    }));

    if (activeTab === 'raw') {
      setGridData([...initialRows, ...Array(5).fill(null).map(createEmptyRow)]);
    } else {
      setGridData(initialRows);
    }
  }, [activeTab, categories]);

  const handleCellChange = (id, field, value) => {
    setGridData(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const extendSheet = () => {
    setGridData(prev => [...prev, ...Array(5).fill(null).map(createEmptyRow)]);
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f1f5f9', paddingBottom: '120px' }}>
      
      {/* التنبيهات الداخلية */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff1f2', borderRight: '5px solid #ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)' }}>
          <AlertTriangle color="#ef4444" size={20} />
          <marquee style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>
            تنبيه نقص مخزن: {alerts.map(a => `${a.name} (${a.balance})`).join(' | ')} - يرجى طلب توريد فوري!
          </marquee>
        </div>
      )}

      {/* الرأس */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '12px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(30,86,49,0.2)' }}>
              {activeTab === 'raw' ? <FileSpreadsheet size={24} /> : <Package size={24} />}
           </div>
           <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
                {activeTab === 'raw' ? 'مخزن المواد الخام' : 'طلبيات المنتج النهائي'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                <Activity size={14} color="#1e5631" />
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e5631' }}>
                  الرصيد الفعلي الحالي: {totalActualStock.toLocaleString()}
                </span>
              </div>
           </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={22} color="#1e293b" />
        </button>
      </div>

      {/* التبديل الرئيسي */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
          <Layers size={18} style={{marginLeft: '8px', verticalAlign: 'middle'}} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
          <Archive size={18} style={{marginLeft: '8px', verticalAlign: 'middle'}} /> المنتج النهائي
        </button>
      </div>

      {/* خيارات العرض */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
           {viewMode === 'table' ? 'وضع تحرير الجداول الذكي' : 'وضع عرض الرفوف البصري'}
        </span>
        <div style={{ background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '2px' }}>
          <button onClick={() => setViewMode('table')} style={{ padding: '8px 12px', border: 'none', background: viewMode === 'table' ? '#1e5631' : 'transparent', borderRadius: '8px', color: viewMode === 'table' ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
            <TableIcon size={18} />
          </button>
          <button onClick={() => setViewMode('shelves')} style={{ padding: '8px 12px', border: 'none', background: viewMode === 'shelves' ? '#1e5631' : 'transparent', borderRadius: '8px', color: viewMode === 'shelves' ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* محتوى العرض - الجدول */}
      {viewMode === 'table' && activeTab === 'raw' ? (
        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '15px', width: '50px', color: '#64748b' }}>#</th>
                  <th style={{ padding: '15px', textAlign: 'right', color: '#1e293b' }}>الصنف</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>التاريخ</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>التكلفة</th>
                  <th style={{ padding: '15px', width: '60px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((item, index) => {
                  const isLow = item.name && item.balance !== '' && parseFloat(item.balance) < 5;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isLow ? '#fff5f5' : 'transparent' }}>
                      <td style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem' }}>{index + 1}</td>
                      <td>
                        <input value={item.name} onChange={(e) => handleCellChange(item.id, 'name', e.target.value)} style={{ width: '100%', border: 'none', padding: '12px 15px', outline: 'none', background: 'transparent' }} placeholder="..." />
                      </td>
                      <td>
                        <input type="date" value={item.date} onChange={(e) => handleCellChange(item.id, 'date', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="number" value={item.balance} onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', color: isLow ? '#ef4444' : '#1e5631' }} placeholder="0" />
                      </td>
                      <td>
                        <input type="number" value={item.price} onChange={(e) => handleCellChange(item.id, 'price', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="0" />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleDeleteProcess(item.id, item.isNew)} 
                          style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '8px' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={extendSheet} style={{ width: '100%', padding: '15px', background: '#fff', border: 'none', color: '#1e5631', fontWeight: 'bold', borderTop: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <Plus size={18} /> تمديد شيت الإكسل
          </button>
        </div>
      ) : (
        /* وضع الرفوف */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {gridData.filter(i => i.name).map(item => {
             const isLow = parseFloat(item.balance) < 5;
             return (
                <div key={item.id} style={{ background: '#fff', borderRadius: '22px', padding: '20px', borderBottom: `5px solid ${isLow ? '#ef4444' : '#1e5631'}`, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' }}>
                  <button 
                    onClick={() => handleDeleteProcess(item.id, item.isNew)}
                    style={{ position: 'absolute', top: '10px', right: '10px', border: 'none', background: '#fff0f0', color: '#ef4444', padding: '5px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                  {isLow && <div style={{ position: 'absolute', top: '10px', left: '10px' }}><AlertTriangle size={16} color="#ef4444" /></div>}
                  <div style={{ background: isLow ? '#fee2e2' : '#f0fdf4', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Package size={26} color={isLow ? '#ef4444' : '#1e5631'} />
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '1rem', color: '#1e293b' }}>{item.name}</div>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: isLow ? '#fee2e2' : '#f1f5f9', borderRadius: '10px', fontSize: '0.85rem', color: isLow ? '#ef4444' : '#1e5631', fontWeight: 'bold', marginTop: '8px' }}>
                    الرصيد: {item.balance}
                  </div>
                </div>
             );
          })}
        </div>
      )}

      {/* زر الحفظ السفلي */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', padding: '20px', background: 'linear-gradient(to top, #f1f5f9 80%, transparent)', zIndex: 100 }}>
        <button style={{ width: '100%', background: '#1e5631', color: '#fff', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(30,86,49,0.3)' }}>
          <Archive size={20} /> حفظ البيانات ومزامنة الإشعارات ✅
        </button>
      </div>

    </div>
  );
};

export default Inventory;
