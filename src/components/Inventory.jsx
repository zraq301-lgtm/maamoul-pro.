import React, { useState } from 'react';
import { Box, Layers, AlertCircle, ArrowRight, Plus, Trash2, Calendar, Package, Table as TableIcon, LayoutGrid, X, FileSpreadsheet, ExternalLink } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');
  const [viewMode, setViewMode] = useState('table'); // افتراضياً عرض شيت الإكسل
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'وحدة' });

  // ضع رابط شيت الإكسل الخاص بك هنا
  const excelSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSXXXXXXXXXXXX/pubhtml?widget=true&headers=false";

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
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', gap: '10px' }}>
               سجل البيانات المتكامل <FileSpreadsheet color="#1e5631" size={24} />
            </h2>
          </div>
        </div>
      </div>

      {/* أزرار التحكم والتبديل */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('raw')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'raw' ? '#1e5631' : '#f1f5f9', color: activeTab === 'raw' ? '#fff' : '#64748b', fontWeight: 'bold' }}>مواد خام</button>
        <button onClick={() => setActiveTab('finished')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: activeTab === 'finished' ? '#1e5631' : '#f1f5f9', color: activeTab === 'finished' ? '#fff' : '#64748b', fontWeight: 'bold' }}>منتج نهائي</button>
        <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: viewMode === 'table' ? '#e8f5e9' : '#fff', color: '#1e5631' }}>
            {viewMode === 'cards' ? <TableIcon size={20} /> : <LayoutGrid size={20} />}
        </button>
      </div>

      {/* منطقة العرض الرئيسية */}
      <div style={{ minHeight: '60vh' }}>
        {viewMode === 'table' ? (
          /* دمج شيت الإكسل المرفوع بدلاً من الجدول العادي */
          <div style={{ width: '100%', height: '70vh', border: '2px solid #1e5631', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#f8fafc', position: 'relative' }}>
             <div style={{ background: '#1e5631', color: '#fff', padding: '8px 15px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>جاري عرض قاعدة بيانات ERP المتزامنة</span>
                <ExternalLink size={14} onClick={() => window.open(excelSheetUrl, '_blank')} style={{cursor: 'pointer'}} />
             </div>
             <iframe 
                src={excelSheetUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="ERP Excel Sheet"
             ></iframe>
          </div>
        ) : (
          /* العرض العادي (نظام الكروت الاحترافي) */
          <div style={{ display: 'grid', gap: '20px' }}>
            {currentDisplay.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  <AlertCircle size={40} style={{ marginBottom: '10px' }} />
                  <p>لا توجد بيانات مسجلة في هذا القسم</p>
               </div>
            ) : (
               currentDisplay.map(cat => (
                  <div key={cat.id} style={{ background: '#fff', borderRadius: '25px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderRight: '6px solid #1e5631' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>{cat.name}</h3>
                        <button onClick={() => onDeleteItem(cat.id)} style={{ background: '#fee2e2', border: 'none', padding: '8px', borderRadius: '10px', color: '#ef4444' }}><Trash2 size={18} /></button>
                     </div>
                     
                     <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                           <div style={{ color: '#64748b', fontSize: '0.75rem' }}>الرصيد</div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e5631' }}>{cat.balance} {cat.unit}</div>
                        </div>
                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                           <div style={{ color: '#64748b', fontSize: '0.75rem' }}>التكلفة</div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e5631' }}>{cat.price} ج.م</div>
                        </div>
                     </div>

                     <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '12px', border: '1px dashed #1e5631' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e5631', marginBottom: '5px' }}>آخر حركة مجدولة:</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569' }}>
                           <span>📅 {cat.batches?.[0]?.date || '2026/05/08'}</span>
                           <span>الحالة: <b style={{color: 'red'}}>صادر</b></span>
                        </div>
                     </div>
                  </div>
               ))
            )}
          </div>
        )}
      </div>

      {/* زر الإضافة العائم والمودال */}
      <button onClick={() => setShowAddModal(true)} style={{ position: 'fixed', bottom: '100px', right: '20px', background: '#1e5631', color: '#fff', border: 'none', width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <Plus size={30} />
      </button>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '30px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: '900' }}>إضافة بيانات جديدة</h3>
              <X onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer', color: '#64748b' }} />
            </div>
            <form onSubmit={handleLocalSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} type="text" placeholder="اسم المادة / الصنف" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} type="number" placeholder="الكمية" value={newItem.balance} onChange={(e) => setNewItem({...newItem, balance: e.target.value})} required />
                <select style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }} value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})}>
                  <option value="كيلو">كيلو</option>
                  <option value="قطعة">قطعة</option>
                  <option value="جرام">جرام</option>
                </select>
              </div>
              <input style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} type="number" placeholder="سعر التكلفة" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} />
              <button type="submit" style={{ background: '#1e5631', color: '#fff', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' }}>تحديث النظام</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
