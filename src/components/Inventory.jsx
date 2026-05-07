import React, { useState } from 'react';
import { Box, Layers, AlertCircle, ArrowRight, Plus, Trash2, Calendar, Package } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'وحدة' });

  // تأمين البيانات وتصفيتها
  const safeCategories = Array.isArray(categories) ? categories : [];
  const rawMaterials = safeCategories.filter(cat => cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز"));
  const finishedGoods = safeCategories.filter(cat => cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز")));
  const currentDisplay = activeTab === 'raw' ? rawMaterials : finishedGoods;

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.balance) return;
    
    // إرسال البيانات المجهزة لـ App.jsx
    onAddItem({
      ...newItem,
      balance: parseFloat(newItem.balance),
      price: parseFloat(newItem.price || 0)
    });
    
    setShowAddModal(false);
    setNewItem({ name: '', balance: '', price: '', unit: 'وحدة' });
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '80px', backgroundColor: '#f8fafc' }}>
      
      {/* الهيدر */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Layers size={28} color="#3498db" />
             <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b' }}>إدارة المخازن</h2>
          </div>
          <button onClick={onBack} style={{ background: '#fff', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* التبويبات */}
        <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '15px' }}>
          <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent', fontWeight: 'bold', color: activeTab === 'raw' ? '#3498db' : '#64748b', cursor: 'pointer', transition: '0.3s' }}>
            مواد خام ({rawMaterials.length})
          </button>
          <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent', fontWeight: 'bold', color: activeTab === 'finished' ? '#e67e22' : '#64748b', cursor: 'pointer', transition: '0.3s' }}>
            منتج نهائي ({finishedGoods.length})
          </button>
        </div>
      </div>

      {/* زر إضافة صنف - يفتح المودال الآن لمنع الشاشة البيضاء */}
      <button 
        onClick={() => setShowAddModal(true)}
        style={{ 
          width: '100%', padding: '15px', borderRadius: '15px', border: '2px dashed #3498db',
          background: 'rgba(52, 152, 219, 0.05)', color: '#3498db', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          marginBottom: '20px', cursor: 'pointer'
        }}
      >
        <Plus size={20} /> إضافة صنف جديد للمخزن
      </button>

      {/* عرض العناصر */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {currentDisplay.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '20px' }}>
            <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5, display: 'inline-block' }} />
            <p>المخزن فارغ حالياً.</p>
          </div>
        ) : currentDisplay.map((cat) => (
          <div key={cat.id} className="glass-card" style={{ padding: '15px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <Box size={20} color="#3b82f6" /> {cat.name}
              </div>
              <button onClick={() => window.confirm(`حذف ${cat.name}؟`) && onDeleteItem(cat.id)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, background: '#f1f5f9', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>الرصيد</div>
                <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>{cat.balance} <span style={{fontSize: '0.8rem'}}>{cat.unit}</span></div>
              </div>
              <div style={{ flex: 1, background: '#f1f5f9', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>السعر (متوسط)</div>
                <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>{cat.price} <span style={{fontSize: '0.8rem'}}>ج.م</span></div>
              </div>
            </div>

            {/* سجل الشحنات المجدولة (كما في الصورة) */}
            <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Package size={14} /> سجل الشحنات (ERP):
              </div>
              {cat.batches && cat.batches.length > 0 ? (
                cat.batches.map((batch, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '6px 0', borderBottom: i !== cat.batches.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {batch.date}</span>
                    <span>الكمية: <b>{batch.qty}</b></span>
                    <span>التكلفة: <b>{batch.cost}</b></span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>لا توجد شحنات مجدولة لهذا الصنف</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* المودال (النافذة المنبثقة) لمنع الشاشة البيضاء */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center', color: '#1e293b' }}>إضافة صنف جديد</h3>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} type="text" placeholder="اسم الصنف (مثلاً: سكر)" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} type="number" placeholder="الكمية" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
                <select style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})}>
                  <option value="وحدة">وحدة</option>
                  <option value="كيلو">كيلو</option>
                  <option value="جرام">جرام</option>
                </select>
              </div>
              <input style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} type="number" placeholder="سعر التكلفة" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 2, background: '#3498db', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' }}>حفظ في المخزن</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', padding: '15px', borderRadius: '12px' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
