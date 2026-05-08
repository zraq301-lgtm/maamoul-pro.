import React, { useState } from 'react';
import { Box, Layers, AlertCircle, ArrowRight, Plus, Trash2, Calendar, Package, Table as TableIcon, LayoutGrid, X, FileSpreadsheet } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'وحدة' });

  const safeCategories = Array.isArray(categories) ? categories : [];
  const rawMaterials = safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"));
  const finishedGoods = safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
  const currentDisplay = activeTab === 'raw' ? rawMaterials : finishedGoods;

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.balance) return;
    onAddItem({ ...newItem, balance: parseFloat(newItem.balance), price: parseFloat(newItem.price || 0) });
    setShowAddModal(false);
    setNewItem({ name: '', balance: '', price: '', unit: 'وحدة' });
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f1f5f9', paddingBottom: '100px' }}>
      
      {/* رأس الصفحة */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <div style={{ background: '#1e5631', color: '#fff', padding: '8px', borderRadius: '10px' }}>
              <FileSpreadsheet size={24} />
           </div>
           <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>مخزن معمول - عرض البيانات</h2>
        </div>
        <button onClick={onBack} style={{ background: '#fff', border: 'none', padding: '10px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* أزرار التبديل */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'raw' ? '#1e5631' : '#fff', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>المواد الخام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: activeTab === 'finished' ? '#1e5631' : '#fff', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>المنتج النهائي</button>
        <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>
            {viewMode === 'cards' ? <TableIcon size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      {/* منطقة الجدول (الإكسل المحاكي) */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: '0.9rem' }}>
              <thead>
                {/* صف الحروف (مثل إكسل) */}
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ width: '40px', border: '1px solid #e2e8f0', padding: '5px', color: '#94a3b8', fontSize: '0.7rem' }}>#</th>
                  <th style={{ border: '1px solid #e2e8f0', color: '#94a3b8' }}>A</th>
                  <th style={{ border: '1px solid #e2e8f0', color: '#94a3b8' }}>B</th>
                  <th style={{ border: '1px solid #e2e8f0', color: '#94a3b8' }}>C</th>
                  <th style={{ border: '1px solid #e2e8f0', color: '#94a3b8' }}>D</th>
                </tr>
                {/* صف العناوين الرئيسي (الأخضر كما في الصورة) */}
                <tr style={{ background: '#1e5631', color: '#fff' }}>
                  <th style={{ border: '1px solid #143d22', padding: '12px' }}>ID</th>
                  <th style={{ border: '1px solid #143d22', padding: '12px' }}>اسم المنتج (البيان)</th>
                  <th style={{ border: '1px solid #143d22', padding: '12px' }}>التاريخ</th>
                  <th style={{ border: '1px solid #143d22', padding: '12px' }}>الكمية</th>
                  <th style={{ border: '1px solid #143d22', padding: '12px' }}>الإجمالي (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                {currentDisplay.map((cat, index) => (
                  <tr key={cat.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fcfdfe' }}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontWeight: 'bold' }}>{cat.name}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center' }}>{cat.batches?.[0]?.date || '2026/05/08'}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center' }}>{cat.balance}</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px', textAlign: 'center', color: '#1e5631', fontWeight: 'bold' }}>
                        {isNaN(cat.price) ? 'خطأ رقمي' : (cat.price * cat.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {/* صفوف فارغة لمحاكاة شكل الشيت */}
                {[...Array(5)].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ border: '1px solid #e2e8f0', padding: '15px', backgroundColor: '#f8fafc' }}>{currentDisplay.length + i + 1}</td>
                    <td style={{ border: '1px solid #e2e8f0' }}></td>
                    <td style={{ border: '1px solid #e2e8f0' }}></td>
                    <td style={{ border: '1px solid #e2e8f0' }}></td>
                    <td style={{ border: '1px solid #e2e8f0' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* عرض الكروت الاحترافي (للموبايل) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '15px', padding: '15px' }}>
            {currentDisplay.map(cat => (
              <div key={cat.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '15px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <span style={{ fontWeight: '900', fontSize: '1.1rem' }}>{cat.name}</span>
                   <Package size={20} color="#1e5631" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                   <span>الرصيد: <b>{cat.balance}</b></span>
                   <span style={{ color: '#1e5631' }}>السعر: <b>{cat.price}</b></span>
                </div>
                <button onClick={() => onDeleteItem(cat.id)} style={{ marginTop: '10px', width: '100%', border: 'none', background: '#fee2e2', color: '#ef4444', padding: '8px', borderRadius: '8px' }}>حذف من المخزن</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* زر الإضافة */}
      <button onClick={() => setShowAddModal(true)} style={{ position: 'fixed', bottom: '110px', left: '20px', width: '56px', height: '56px', borderRadius: '50%', background: '#1e5631', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(30, 86, 49, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={28} />
      </button>

      {/* المودال */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '25px' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>إدخال بيانات إكسل</h3>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="text" placeholder="اسم المنتج" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="number" placeholder="الكمية" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="number" placeholder="سعر التكلفة" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <button type="submit" style={{ background: '#1e5631', color: '#fff', padding: '15px', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>تثبيت في الجدول</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#f1f5f9', color: '#64748b', padding: '10px', border: 'none', borderRadius: '12px' }}>إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
