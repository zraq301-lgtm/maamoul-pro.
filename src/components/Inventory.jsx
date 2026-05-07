import React, { useState } from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw, Plus, Trash2, ShoppingCart, Truck } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw');

  // تأمين البيانات: التأكد أن categories دائماً مصفوفة لتجنب انهيار التطبيق
  const safeCategories = Array.isArray(categories) ? categories : [];

  // تصفية البيانات
  const rawMaterials = safeCategories.filter(cat => 
    cat.name && !cat.name.includes("معمول") && !cat.name.includes("جاهز")
  );
  const finishedGoods = safeCategories.filter(cat => 
    cat.name && (cat.name.includes("معمول") || cat.name.includes("جاهز"))
  );

  const currentDisplay = activeTab === 'raw' ? rawMaterials : finishedGoods;

  const totalItems = currentDisplay.reduce((sum, cat) => sum + (parseFloat(cat.balance) || 0), 0);
  const totalValue = currentDisplay.reduce((sum, cat) => sum + ((parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0)), 0);

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* الرأس ونظام التبويبات */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Layers size={28} color="#3498db" />
             <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>إدارة المخازن</h2>
          </div>
          <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowRight size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '5px', background: '#e2e8f0', padding: '5px', borderRadius: '15px' }}>
          <button 
            onClick={() => setActiveTab('raw')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              backgroundColor: activeTab === 'raw' ? '#fff' : 'transparent',
              fontWeight: 'bold', color: activeTab === 'raw' ? '#3498db' : '#64748b',
              transition: '0.3s', cursor: 'pointer'
            }}
          >
            مواد خام
          </button>
          <button 
            onClick={() => setActiveTab('finished')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
              backgroundColor: activeTab === 'finished' ? '#fff' : 'transparent',
              fontWeight: 'bold', color: activeTab === 'finished' ? '#e67e22' : '#64748b',
              transition: '0.3s', cursor: 'pointer'
            }}
          >
            منتج نهائي
          </button>
        </div>
      </div>

      {/* ملخص سريع */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>إجمالي الكمية</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: activeTab === 'raw' ? '#3498db' : '#e67e22' }}>
            {totalItems.toLocaleString()}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>قيمة المخزون</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2ecc71' }}>
            {totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      <button 
        onClick={onAddItem}
        style={{ 
          width: '100%', padding: '12px', borderRadius: '15px', border: '2px dashed #cbd5e1',
          background: 'rgba(255,255,255,0.5)', color: '#475569', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          marginBottom: '20px', cursor: 'pointer'
        }}
      >
        <Plus size={18} /> إضافة صنف جديد (يدوي)
      </button>

      {/* عرض القائمة */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {currentDisplay.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5, display: 'inline-block' }} />
            <p>لا توجد بيانات في هذا القسم حالياً.</p>
          </div>
        ) : currentDisplay.map((cat) => {
          const balance = parseFloat(cat.balance) || 0; 
          const price = parseFloat(cat.price) || 0; 
          const value = balance * price;
          const statusColor = balance <= 0 ? '#ef4444' : balance < 10 ? '#f59e0b' : '#3b82f6';
          
          return (
            <div key={cat.id || Math.random()} className="glass-card" style={{ borderRight: `5px solid ${statusColor}`, padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeTab === 'raw' ? <Box size={20} color="#3498db" /> : <Truck size={20} color="#e67e22" />}
                  <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}>{cat.name || 'صنف بدون اسم'}</span>
                </div>
                <button onClick={() => onDeleteItem(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>الرصيد</div>
                  <div style={{ fontWeight: 'bold', color: statusColor }}>{balance} {cat.unit || 'وحدة'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>السعر</div>
                  <div style={{ fontWeight: 'bold' }}>{price.toLocaleString()}</div>
                </div>
              </div>

              {/* التحقق من وجود المصفوفة قبل عمل Map للـ Batches */}
              {Array.isArray(cat.batches) && cat.batches.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '5px' }}>التشغيلات:</div>
                  <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
                    {cat.batches.map((batch, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem' }}>
                        📦 {batch.quantity || batch.qty} | {batch.price || batch.cost} ج.م
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>القيمة الكلية:</span>
                <span style={{ fontWeight: '900', color: '#2ecc71' }}>{value.toLocaleString()} ج.م</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;
