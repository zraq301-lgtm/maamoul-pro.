import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ArrowRight, Plus, Table as TableIcon, LayoutGrid, Trash2, Package, Archive, Layers } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' أو 'finished'
  const [viewMode, setViewMode] = useState('table'); // 'table' أو 'shelves'
  const [gridData, setGridData] = useState([]);

  // دالة لتوليد سطر فارغ
  const createEmptyRow = () => ({
    id: `new-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    date: new Date().toISOString().split('T')[0],
    balance: '',
    price: '',
    isNew: true
  });

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

    // المنتج النهائي يظهر كبيانات فقط، المواد الخام تفتح شيت إكسل
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
      
      {/* الرأس */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '12px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(30,86,49,0.2)' }}>
              {activeTab === 'raw' ? <FileSpreadsheet size={24} /> : <Package size={24} />}
           </div>
           <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>
                {activeTab === 'raw' ? 'مخزن المواد الخام' : 'طلبيات المنتج النهائي'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>إدارة ذكية للمخزون</span>
           </div>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={24} color="#1e293b" />
        </button>
      </div>

      {/* التبديل الرئيسي */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', color: activeTab === 'raw' ? '#1e5631' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>
          <Layers size={18} style={{marginLeft: '8px'}} /> المواد الخام
        </button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '11px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', color: activeTab === 'finished' ? '#1e5631' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>
          <Archive size={18} style={{marginLeft: '8px'}} /> المنتج النهائي
        </button>
      </div>

      {/* زر تبديل العرض (جدول / رفوف) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <div style={{ background: '#fff', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setViewMode('table')} style={{ padding: '8px 15px', border: 'none', background: viewMode === 'table' ? '#f1f5f9' : 'transparent', borderRadius: '8px', color: viewMode === 'table' ? '#1e5631' : '#94a3b8' }}>
            <TableIcon size={20} />
          </button>
          <button onClick={() => setViewMode('shelves')} style={{ padding: '8px 15px', border: 'none', background: viewMode === 'shelves' ? '#f1f5f9' : 'transparent', borderRadius: '8px', color: viewMode === 'shelves' ? '#1e5631' : '#94a3b8' }}>
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {/* محتوى العرض */}
      {viewMode === 'table' && activeTab === 'raw' ? (
        /* عرض الإكسل للمواد الخام */
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1e5631', color: '#fff' }}>
                  <th style={{ padding: '12px', width: '40px' }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>الصنف</th>
                  <th style={{ padding: '12px' }}>التاريخ</th>
                  <th style={{ padding: '12px' }}>الكمية</th>
                  <th style={{ padding: '12px' }}>السعر</th>
                  <th style={{ padding: '12px' }}>حذف</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{index + 1}</td>
                    <td><input value={item.name} onChange={(e) => handleCellChange(item.id, 'name', e.target.value)} style={{ width: '100%', border: 'none', padding: '12px', outline: 'none' }} placeholder="..." /></td>
                    <td><input type="date" value={item.date} onChange={(e) => handleCellChange(item.id, 'date', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.8rem' }} /></td>
                    <td><input type="number" value={item.balance} onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)} style={{ width: '60px', border: 'none', outline: 'none', textAlign: 'center' }} /></td>
                    <td><input type="number" value={item.price} onChange={(e) => handleCellChange(item.id, 'price', e.target.value)} style={{ width: '60px', border: 'none', outline: 'none', textAlign: 'center' }} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => onDeleteItem(item.id)} style={{ color: '#ef4444', border: 'none', background: 'none' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={extendSheet} style={{ width: '100%', padding: '12px', background: '#f8fafc', border: 'none', color: '#1e5631', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> تمديد شيت الإكسل (إضافة صفوف)
          </button>
        </div>
      ) : (
        /* عرض الرفوف للمنتج النهائي أو عند اختيار وضع الرفوف */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' }}>
          {gridData.filter(i => i.name).map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: '18px', padding: '15px', borderBottom: '4px solid #1e5631', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', position: 'relative' }}>
              <div style={{ background: '#f0fdf4', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Package size={24} color="#1e5631" />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '5px' }}>{item.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>الكمية: {item.balance}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                <button onClick={() => onDeleteItem(item.id)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {activeTab === 'finished' && (
             <div onClick={onBack} style={{ border: '2px dashed #cbd5e1', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', minHeight: '140px', cursor: 'pointer' }}>
                <Plus size={30} />
                <span style={{fontSize: '0.8rem'}}>إضافة طلب جديد</span>
             </div>
          )}
        </div>
      )}

      {/* زر الحفظ العائم */}
      <button style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', background: '#1e5631', color: '#fff', border: 'none', padding: '18px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 10px 20px rgba(30,86,49,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        اعتماد وحفظ البيانات في السحابة ☁️
      </button>

    </div>
  );
};

export default Inventory;
