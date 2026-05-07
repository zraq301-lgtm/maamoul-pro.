import React, { useState } from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw, Plus, Trash2, ShoppingCart, Truck } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('raw'); // 'raw' أو 'finished'

  // تصفية البيانات بناءً على النوع (الخامات مقابل المنتج النهائي)
  // نفترض أن المنتج النهائي اسمه دائماً يحتوي على "معمول" أو "جاهز"
  const rawMaterials = categories.filter(cat => !cat.name.includes("معمول") && !cat.name.includes("جاهز"));
  const finishedGoods = categories.filter(cat => cat.name.includes("معمول") || cat.name.includes("جاهز"));

  const currentDisplay = activeTab === 'raw' ? rawMaterials : finishedGoods;

  const totalItems = currentDisplay.reduce((sum, cat) => sum + (parseFloat(cat.balance) || 0), 0);
  const totalValue = currentDisplay.reduce((sum, cat) => sum + ((parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0)), 0);

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* الهيدر ونظام التبويبات ERP */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Layers size={28} color="#3498db" />
             <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>إدارة المخازن</h2>
          </div>
          <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%' }}>
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
              boxShadow: activeTab === 'raw' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
              transition: '0.3s'
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
              boxShadow: activeTab === 'finished' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
              transition: '0.3s'
            }}
          >
            منتج نهائي
          </button>
        </div>
      </div>

      {/* ملخص سريع للقسم المفتوح */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center', background: activeTab === 'raw' ? 'rgba(52, 152, 219, 0.05)' : 'rgba(230, 126, 34, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>إجمالي الكمية</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: activeTab === 'raw' ? '#3498db' : '#e67e22' }}>
            {totalItems.toLocaleString()}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>قيمة المخزون</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2ecc71' }}>
            {totalValue.toLocaleString()} <span style={{fontSize: '0.7rem'}}>ج.م</span>
          </div>
        </div>
      </div>

      {/* زر الإضافة المباشرة */}
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

      {/* قائمة العناصر */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr' }}>
        {currentDisplay.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>لا توجد بيانات في هذا القسم حالياً.</p>
          </div>
        ) : currentDisplay.map((cat) => {
          const balance = parseFloat(cat.balance) || 0; 
          const price = parseFloat(cat.price) || 0; 
          const value = balance * price;
          const statusColor = balance <= 0 ? '#ef4444' : balance < 10 ? '#f59e0b' : '#3b82f6';
          
          return (
            <div key={cat.id} className="glass-card" style={{ borderRight: `5px solid ${statusColor}`, padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeTab === 'raw' ? <Box size={20} color="#3498db" /> : <Truck size={20} color="#e67e22" />}
                  <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}>{cat.name}</span>
                </div>
                <button onClick={() => onDeleteItem(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>الرصيد المتاح</div>
                  <div style={{ fontWeight: 'bold', color: statusColor }}>{balance} {cat.unit}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>متوسط السعر</div>
                  <div style={{ fontWeight: 'bold' }}>{price.toLocaleString()} ج.م</div>
                </div>
              </div>

              {/* ميزة الـ ERP: عرض الجدولة (Batches) إذا وجدت */}
              {cat.batches && cat.batches.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '5px' }}>تفاصيل التشغيلات (Batches):</div>
                  <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {cat.batches.map((batch, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                        📦 {batch.quantity} | {batch.price} ج.م
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>إجمالي القيمة:</span>
                <span style={{ fontWeight: '900', color: '#2ecc71' }}>{value.toLocaleString()} ج.م</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* تنبيه خاص بالمنتج النهائي فقط (الطلبيات) */}
      {activeTab === 'finished' && (
        <div style={{ 
          marginTop: '20px', padding: '15px', borderRadius: '15px', 
          background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)', 
          border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '12px' 
        }}>
          <div style={{ background: '#ffedd5', padding: '10px', borderRadius: '12px' }}>
            <ShoppingCart color="#e67e22" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>طلبات بانتظار الشحن</div>
            <div style={{ fontSize: '0.75rem', color: '#9a3412' }}>يمكنك متابعة الشحنات من قسم التقارير</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
