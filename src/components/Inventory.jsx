import React, { useState } from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw, Plus, Trash2, ShoppingCart, Truck } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');

  // تأمين البيانات
  const safeCategories = Array.isArray(categories) ? categories : [];

  // تصفية البيانات (خامات vs منتج نهائي)
  const rawMaterials = safeCategories.filter(cat => 
    cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز")
  );
  const finishedGoods = safeCategories.filter(cat => 
    cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز"))
  );

  const currentDisplay = activeTab === 'raw' ? rawMaterials : finishedGoods;

  // الحسابات
  const totalItems = currentDisplay.reduce((sum, cat) => sum + (parseFloat(cat.balance) || 0), 0);
  const totalValue = currentDisplay.reduce((sum, cat) => sum + ((parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0)), 0);

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* الهيدر */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Layers size={28} color="#3498db" />
             <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>إدارة المخازن</h2>
          </div>
          <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* التبويبات */}
        <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '15px' }}>
          <button 
            onClick={() => setActiveTab('raw')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent',
              fontWeight: 'bold', color: activeTab === 'raw' ? '#3498db' : '#64748b',
              cursor: 'pointer'
            }}
          >
            مواد خام ({rawMaterials.length})
          </button>
          <button 
            onClick={() => setActiveTab('finished')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent',
              fontWeight: 'bold', color: activeTab === 'finished' ? '#e67e22' : '#64748b',
              cursor: 'pointer'
            }}
          >
            منتج نهائي ({finishedGoods.length})
          </button>
        </div>
      </div>

      {/* زر إضافة صنف - تأكد من تمرير الوظيفة في App.jsx */}
      <button 
        onClick={() => {
            console.log("Adding item..."); // للتأكد من عمل الزر
            onAddItem && onAddItem();
        }}
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
      <div style={{ display: 'grid', gap: '12px' }}>
        {currentDisplay.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5, display: 'inline-block' }} />
            <p>المخزن فارغ حالياً.</p>
          </div>
        ) : currentDisplay.map((cat) => {
          const balance = parseFloat(cat.balance) || 0; 
          const price = parseFloat(cat.price) || 0; 
          
          return (
            <div key={cat.id} className="glass-card" style={{ padding: '15px', borderRight: `5px solid ${balance < 5 ? '#ef4444' : '#3b82f6'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={18} color="#64748b" /> {cat.name}
                </div>
                {/* زر الحذف */}
                <button 
                  onClick={() => {
                    if(window.confirm(`هل أنت متأكد من حذف ${cat.name}؟`)) {
                        onDeleteItem && onDeleteItem(cat.id);
                    }
                  }} 
                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* بيانات الرصيد */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>الرصيد</div>
                  <div style={{ fontWeight: '900' }}>{balance} {cat.unit}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>السعر (متوسط)</div>
                  <div style={{ fontWeight: '900' }}>{price} ج.م</div>
                </div>
              </div>

              {/* نظام الجدولة ERP - عرض الشحنات (Batches) */}
              {cat.batches && cat.batches.length > 0 ? (
                <div style={{ marginTop: '10px', background: 'rgba(52, 152, 219, 0.05)', padding: '10px', borderRadius: '10px' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3498db', marginBottom: '5px' }}>📦 سجل الشحنات (ERP):</div>
                   {cat.batches.map((batch, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderBottom: '1px solid #e2e8f0', padding: '3px 0' }}>
                        <span>📅 {batch.date || 'قديم'}</span>
                        <span>الكمية: <b>{batch.qty || batch.quantity}</b></span>
                        <span>التكلفة: <b>{batch.cost || batch.price}</b></span>
                     </div>
                   ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                  لا توجد شحنات مجدولة لهذا الصنف (إدخال يدوي)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;
