import React, { useState, useEffect } from 'react';
import { Box, Plus, Trash2, Package, Table as TableIcon, LayoutGrid, X, FileSpreadsheet, ArrowRight } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // حالة لإدارة البيانات القابلة للتعديل داخل الجدول
  const [gridData, setGridData] = useState([]);

  // تحديث البيانات عند تغيير التصنيف
  useEffect(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filtered = activeTab === 'raw' 
      ? safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"))
      : safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
    
    // إضافة صفوف فارغة إضافية للسماح بالكتابة الحرة (مثل إكسل)
    const emptyRows = Array(10).fill({ id: Math.random(), name: '', balance: '', price: 0, isNew: true });
    setGridData([...filtered, ...emptyRows]);
  }, [categories, activeTab]);

  // دالة لمعالجة التغيير داخل أي خلية
  const handleCellChange = (id, field, value) => {
    const updatedData = gridData.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setGridData(updatedData);
  };

  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'وحدة' });

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.balance) return;
    onAddItem({ ...newItem, balance: parseFloat(newItem.balance), price: parseFloat(newItem.price || 0) });
    setShowAddModal(false);
    setNewItem({ name: '', balance: '', price: '', unit: 'وحدة' });
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '100px' }}>
      
      {/* هيدر النظام */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '8px', borderRadius: '12px' }}>
              <FileSpreadsheet size={24} />
           </div>
           <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>شيت إدارة المخزون التفاعلي</h2>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* التبديل بين الأقسام */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#1e5631' : '#fff', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold' }}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#1e5631' : '#fff', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold' }}>المنتج النهائي</button>
        <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
            {viewMode === 'cards' ? <TableIcon size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      {/* منطقة الشيت الفعال */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ width: '40px', border: '1px solid #cbd5e1', padding: '4px', fontSize: '0.7rem', color: '#94a3b8' }}></th>
                  <th style={{ border: '1px solid #cbd5e1', color: '#94a3b8', fontWeight: 'normal', fontSize: '0.8rem' }}>A</th>
                  <th style={{ border: '1px solid #cbd5e1', color: '#94a3b8', fontWeight: 'normal', fontSize: '0.8rem' }}>B</th>
                  <th style={{ border: '1px solid #cbd5e1', color: '#94a3b8', fontWeight: 'normal', fontSize: '0.8rem' }}>C</th>
                  <th style={{ border: '1px solid #cbd5e1', color: '#94a3b8', fontWeight: 'normal', fontSize: '0.8rem' }}>D</th>
                </tr>
                <tr style={{ background: '#1e5631', color: '#fff' }}>
                  <th style={{ border: '1px solid #143d22', padding: '10px' }}>#</th>
                  <th style={{ border: '1px solid #143d22', padding: '10px' }}>البيان (اسم المنتج)</th>
                  <th style={{ border: '1px solid #143d22', padding: '10px' }}>الكمية</th>
                  <th style={{ border: '1px solid #143d22', padding: '10px' }}>سعر الوحدة</th>
                  <th style={{ border: '1px solid #143d22', padding: '10px' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #e2e8f0', textAlign: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '0.8rem' }}>{index + 1}</td>
                    {/* خلية البيان القابلة للتعديل */}
                    <td style={{ border: '1px solid #e2e8f0', padding: 0 }}>
                      <input 
                        value={item.name} 
                        onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '10px', outline: 'none', fontSize: '0.9rem', background: 'transparent' }}
                        placeholder="..."
                      />
                    </td>
                    {/* خلية الكمية القابلة للتعديل */}
                    <td style={{ border: '1px solid #e2e8f0', padding: 0 }}>
                      <input 
                        type="number"
                        value={item.balance} 
                        onChange={(e) => handleCellChange(item.id, 'balance', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '10px', outline: 'none', textAlign: 'center', background: 'transparent' }}
                      />
                    </td>
                    {/* خلية السعر القابلة للتعديل */}
                    <td style={{ border: '1px solid #e2e8f0', padding: 0 }}>
                      <input 
                        type="number"
                        value={item.price} 
                        onChange={(e) => handleCellChange(item.id, 'price', e.target.value)}
                        style={{ width: '100%', border: 'none', padding: '10px', outline: 'none', textAlign: 'center', background: 'transparent' }}
                      />
                    </td>
                    {/* خلية الإجمالي (محسوبة تلقائياً) */}
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e5631', background: '#f0fdf4' }}>
                      {(parseFloat(item.balance || 0) * parseFloat(item.price || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* عرض الكروت للموبايل */
          <div style={{ padding: '15px', display: 'grid', gap: '15px' }}>
            {gridData.filter(i => i.name).map(cat => (
              <div key={cat.id} style={{ background: '#fff', borderRadius: '15px', padding: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{cat.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem' }}>
                   <span>الكمية: {cat.balance}</span>
                   <span style={{color: '#1e5631'}}>الإجمالي: {cat.balance * cat.price} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر إضافة صنف جديد (طريقة ثانية سريعة) */}
      <button onClick={() => setShowAddModal(true)} style={{ position: 'fixed', bottom: '110px', left: '20px', background: '#1e5631', color: '#fff', border: 'none', width: '56px', height: '56px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={28} />
      </button>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '25px' }}>
            <h3 style={{ marginBottom: '20px' }}>إضافة سطر جديد للشيت</h3>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} type="text" placeholder="اسم الصنف" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} type="number" placeholder="الكمية" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
              <button type="submit" style={{ background: '#1e5631', color: '#fff', padding: '15px', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>إضافة للجدول</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', color: '#64748b' }}>إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
