import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Table as TableIcon, LayoutGrid, Trash2, Package, Archive, Layers, Activity, AlertTriangle, Calculator } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem, setStock }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  const [gridData, setGridData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // حساب الرصيد الإجمالي الفعلي للمخزن الظاهر
  const totalActualStock = useMemo(() => {
    return gridData.reduce((sum, item) => sum + (parseFloat(item.balance) || 0), 0);
  }, [gridData]);

  // تنبيهات النقص في المخزن
  useEffect(() => {
    const lowStockItems = gridData.filter(item => 
      item.name && item.balance !== '' && parseFloat(item.balance) < 5
    );
    setAlerts(lowStockItems);
  }, [gridData]);

  // إنشاء صف فارغ مع الحقول الجديدة (الوحدة)
  const createEmptyRow = () => ({
    id: `new-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    unit: 'كيلو', // الحقل الجديد
    date: new Date().toISOString().split('T')[0],
    balance: '',
    price: '',
    total: 0, // الحقل المحسوب
    isNew: true
  });

  // --- الربط الاحترافي مع App.jsx للحذف ---
  const handleDeleteProcess = (id, isNew) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصنف من المخزن والسحاب؟")) {
      // حذف محلي من واجهة الإكسل فوراً
      setGridData(prev => prev.filter(item => item.id !== id));
      
      // إرسال طلب الحذف للمحرك الرئيسي App.jsx ليتولى الحذف من السحاب والأندرويد
      if (!isNew && onDeleteItem) {
        onDeleteItem(id); 
      }
    }
  };

  // تحميل البيانات وتوزيعها حسب التبويب
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw' 
      ? safeCategories.filter(cat => cat.category !== 'finished')
      : safeCategories.filter(cat => cat.category === 'finished');
    
    const initialRows = filtered.map(cat => ({
      id: cat.id,
      name: cat.name || '',
      unit: cat.unit || 'كيلو',
      date: cat.date || new Date().toISOString().split('T')[0],
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

  // --- محرك حساب الإكسل الذكي ---
  const handleCellChange = (id, field, value) => {
    setGridData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // حساب الإجمالي تلقائياً إذا تغيرت الكمية أو السعر
        if (field === 'balance' || field === 'price') {
          const qty = parseFloat(field === 'balance' ? value : item.balance) || 0;
          const prc = parseFloat(field === 'price' ? value : item.price) || 0;
          updatedItem.total = (qty * prc).toFixed(2);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSaveAll = () => {
    // تصفية الصفوف الممتلئة فقط
    const filledData = gridData.filter(item => item.name.trim() !== '');
    // إرسال البيانات المحدثة للمحرك الرئيسي
    setStock(filledData);
    alert("✅ تم تحديث المخزن ومزامنة البيانات مع السحاب");
  };

  const extendSheet = () => {
    setGridData(prev => [...prev, ...Array(5).fill(null).map(createEmptyRow)]);
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: 'Arial', minHeight: '100vh', backgroundColor: '#f1f5f9', paddingBottom: '120px' }}>
      
      {/* رأس الصفحة والتنبيهات */}
      <div style={headerSectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={iconBoxStyle}>
              {activeTab === 'raw' ? <Layers size={24} /> : <Package size={24} />}
           </div>
           <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>إدارة المخازن الذكية</h2>
              <span style={{ fontSize: '0.8rem', color: '#1e5631' }}>إجمالي المخزون: {totalActualStock}</span>
           </div>
        </div>
        <button onClick={onBack} style={backBtnStyle}><ArrowRight size={22} /></button>
      </div>

      {/* تبديل الأقسام */}
      <div style={tabContainerStyle}>
        <button onClick={() => setActiveTab('raw')} style={{ ...tabStyle, backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent' }}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={{ ...tabStyle, backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent' }}>المنتج النهائي</button>
      </div>

      {/* جدول الإكسل المطور */}
      <div style={tableWrapperStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadStyle}>
                <th style={thStyle}>الصنف</th>
                <th style={thStyle}>الوحدة</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>الكمية</th>
                <th style={thStyle}>السعر</th>
                <th style={thStyle}>الإجمالي</th>
                <th style={{ ...thStyle, width: '40px' }}><Trash2 size={16} /></th>
              </tr>
            </thead>
            <tbody>
              {gridData.map((item) => (
                <tr key={item.id} style={trStyle}>
                  <td><input value={item.name} onChange={(e) => handleCellChange(item.id, 'name', e.target.value)} style={inputStyle} placeholder="اسم الصنف..." /></td>
                  <td><input value={item.unit} onChange={(e) => handleCellChange(item.id, 'unit', e.target.value)} style={{ ...inputStyle, textAlign: 'center', width: '60px' }} placeholder="كيلو" /></td>
                  <td><input type="date" value={item.date} onChange={(e) => handleCellChange(item.id, 'date', e.target.value)} style={inputStyle} /></td>
                  <td><input type="number" value={item.balance} onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)} style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold', color: '#1e5631' }} placeholder="0" /></td>
                  <td><input type="number" value={item.price} onChange={(e) => handleCellChange(item.id, 'price', e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} placeholder="0" /></td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc' }}>{item.total}</td>
                  <td>
                    <button onClick={() => handleDeleteProcess(item.id, item.isNew)} style={deleteBtnStyle}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={extendSheet} style={extendBtnStyle}><Plus size={18} /> إضافة صفوف إضافية</button>
      </div>

      {/* زر الحفظ والمزامنة المركزي */}
      <div style={footerStyle}>
        <button onClick={handleSaveAll} style={saveBtnStyle}>
          <Archive size={20} /> حفظ وتحديث السحاب (Cloud Sync)
        </button>
      </div>
    </div>
  );
};

// الستايلات المنسقة
const headerSectionStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const iconBoxStyle = { background: '#1e5631', color: '#fff', padding: '10px', borderRadius: '12px' };
const backBtnStyle = { background: '#fff', border: 'none', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const tabContainerStyle = { display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '15px' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };
const tableWrapperStyle = { background: '#fff', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '12px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const inputStyle = { width: '100%', border: 'none', padding: '10px', outline: 'none', background: 'transparent', fontSize: '0.9rem' };
const deleteBtnStyle = { border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' };
const extendBtnStyle = { width: '100%', padding: '12px', background: '#fff', border: 'none', color: '#1e5631', fontWeight: 'bold', cursor: 'pointer', borderTop: '1px dashed #ccc' };
const footerStyle = { position: 'fixed', bottom: '80px', left: '15px', right: '15px', zIndex: 100 };
const saveBtnStyle = { width: '100%', background: '#1e5631', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 5px 15px rgba(30,86,49,0.3)' };

export default Inventory;
