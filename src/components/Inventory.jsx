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
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#fff', paddingBottom: '100px' }}>
      
      {/* الهيدر العلوي */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '12px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={24} color="#000" />
          </button>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', gap: '10px' }}>
              عرض البيانات المجدولة <FileSpreadsheet color="#1e5631" size={28} />
            </h2>
          </div>
        </div>
      </div>

      {/* التبديل بين الأقسام */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#1e5631' : '#f1f5f9', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold' }}>مواد خام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#1e5631' : '#f1f5f9', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold' }}>منتج نهائي</button>
        <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
            {viewMode === 'cards' ? <TableIcon size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      {/* المحتوى الرئيسي */}
      {viewMode === 'table' ? (
        /* عرض الإكسل المماثل للصورة */
        <div style={{ border: '2px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#1e5631', color: '#fff' }}>
                <th style={{ padding: '12px', border: '1px solid #fff' }}>التاريخ</th>
                <th style={{ padding: '12px', border: '1px solid #fff' }}>البيان</th>
                <th style={{ padding: '12px', border: '1px solid #fff' }}>النوع</th>
                <th style={{ padding: '12px', border: '1px solid #fff' }}>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {currentDisplay.map((cat, index) => (
                <tr key={cat.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                    {cat.batches?.[0]?.date || '2026/5/8'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>{cat.name}</td>
                  <td style={{ padding: '12px', border: '1px solid #e2e8f0', color: 'red' }}>صادر</td>
                  <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                    {isNaN(cat.price) ? <span style={{fontSize:'0.8rem'}}>ليس رقم</span> : cat.price * cat.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* العرض العادي (نظام الكروت) */
        <div style={{ display: 'grid', gap: '20px' }}>
          {currentDisplay.map(cat => (
            <div key={cat.id} style={{ background: '#fff', borderRadius: '25px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderLeft: '6px solid #3498db', position: 'relative' }}>
               <button onClick={() => onDeleteItem(cat.id)} style={{ position: 'absolute', top: '15px', left: '15px', background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '10px', color: '#ef4444' }}><Trash2 size={18} /></button>
               <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem' }}>
                  <Box color="#3498db" /> {cat.name}
               </h3>
               <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                     <div style={{ color: '#64748b', fontSize: '0.8rem' }}>الرصيد</div>
                     <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{cat.balance} {cat.unit}</div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '15px', textAlign: 'center' }}>
                     <div style={{ color: '#64748b', fontSize: '0.8rem' }}>السعر (متوسط)</div>
                     <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{cat.price} ج.م</div>
                  </div>
               </div>
               {/* سجل الشحنات المجدولة */}
               <div style={{ marginTop: '15px', padding: '12px', background: '#eff6ff', borderRadius: '12px', border: '1px dashed #3b82f6' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                     <Package size={16} /> سجل الشحنات (ERP):
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                     <span>📅 {cat.batches?.[0]?.date || '2026-05-07'}</span>
                     <span>الكمية: {cat.balance}</span>
                     <span>التكلفة: {cat.price}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* زر الإضافة العائم */}
      <button onClick={() => setShowAddModal(true)} style={{ position: 'fixed', bottom: '100px', right: '20px', background: '#1e5631', color: '#fff', border: 'none', width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={30} />
      </button>

      {/* مودال الإضافة */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>إضافة صنف</h3>
              <X onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} type="text" placeholder="اسم الصنف" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} type="number" placeholder="الكمية" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} type="number" placeholder="السعر" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <button type="submit" style={{ background: '#1e5631', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>حفظ البيانات</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
