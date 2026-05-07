import React, { useState } from 'react';
import { Box, Layers, AlertCircle, ArrowRight, Plus, Trash2, Calendar, Package, Table as TableIcon, LayoutGrid, X, ArrowLeftRight, Edit3 } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table'); // افتراضياً وضع الجدول ERP
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
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '100px' }}>
      
      {/* هيدر النظام */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#3498db', padding: '8px', borderRadius: '12px', color: '#fff' }}>
            <Layers size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#1e293b' }}>نظام جرد معمول</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', color: '#3498db', cursor: 'pointer' }}>
            {viewMode === 'cards' ? <TableIcon size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button onClick={onBack} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* تبويبات الأقسام */}
      <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '16px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#3498db' : 'transparent', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>مواد خام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#e67e22' : 'transparent', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold', transition: '0.3s' }}>منتج نهائي</button>
      </div>

      <button onClick={() => setShowAddModal(true)} style={{ width: '100%', padding: '15px', borderRadius: '16px', border: '2px dashed #cbd5e1', background: '#fff', color: '#475569', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
        <Plus size={20} /> إضافة سجل جديد للمخزن
      </button>

      {/* عرض البيانات بنظام Excel ERP */}
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}> {/* للسماح بالتحرك داخل الجدول على الموبايل */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem' }}>الصنف</th>
                  <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem' }}>الرصيد الحالي</th>
                  <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem' }}>التكلفة (ج.م)</th>
                  <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem' }}>آخر حركة</th>
                  <th style={{ padding: '15px', color: '#64748b', fontSize: '0.85rem' }}>عمليات ERP</th>
                </tr>
              </thead>
              <tbody>
                {currentDisplay.map((cat, index) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#fff' : '#fcfdfe' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>{cat.name}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '8px', background: cat.balance < 5 ? '#fee2e2' : '#f1f5f9', color: cat.balance < 5 ? '#ef4444' : '#1e293b', fontWeight: 'bold' }}>
                        {cat.balance} {cat.unit}
                      </span>
                    </td>
                    <td style={{ padding: '15px', color: '#059669', fontWeight: 'bold' }}>{cat.price}</td>
                    <td style={{ padding: '15px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {cat.batches?.[cat.batches.length - 1]?.date || 'لا يوجد'}
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* زر تحويل/ترحيل افتراضي */}
                        <button title="ترحيل عمليات" style={{ border: 'none', background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
                          <ArrowLeftRight size={16} />
                        </button>
                        <button onClick={() => window.confirm('حذف؟') && onDeleteItem(cat.id)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* عرض الكروت المنسق */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', padding: '15px' }}>
            {currentDisplay.map(cat => (
              <div key={cat.id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                  <Package size={18} color="#94a3b8" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>الرصيد: <b>{cat.balance}</b></span>
                  <span style={{ color: '#059669' }}>السعر: <b>{cat.price} ج.م</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* المودال الاحترافي للإضافة */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '30px', position: 'relative' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ textAlign: 'center', marginBottom: '25px', fontSize: '1.2rem', fontWeight: '900' }}>إدخال بيانات مخزنية</h3>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>اسم المادة / المنتج</label>
                <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} type="text" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px', display: 'block' }}>الكمية</label>
                  <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} type="number" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '5px', display: 'block' }}>الوحدة</label>
                  <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})}>
                    <option value="كيلو">كيلو</option>
                    <option value="قطعة">قطعة</option>
                    <option value="جرام">جرام</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '5px' }}>التكلفة لكل وحدة</label>
                <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} type="number" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              </div>
              <button type="submit" style={{ background: '#3498db', color: '#fff', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', marginTop: '10px', fontSize: '1rem' }}>اعتماد وحفظ في الجدول</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
