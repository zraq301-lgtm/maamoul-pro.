import React from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw, Plus, Trash2 } from 'lucide-react';

const Inventory = ({ categories = [], onBack, onAddItem, onDeleteItem }) => {
  const totalItems = categories.reduce((sum, cat) => sum + (parseFloat(cat.balance) || 0), 0);
  const totalValue = categories.reduce((sum, cat) => sum + ((parseFloat(cat.balance) || 0) * (parseFloat(cat.price) || 0)), 0);

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <Layers size={28} color="#3498db" />
          <h2>المخزن</h2>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={onAddItem}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              backgroundColor: '#2ecc71', 
              color: 'white', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '10px', 
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            <Plus size={16} /> إضافة صنف
          </button>
          <div style={{ fontSize: '0.8rem', color: '#64748b', background: 'rgba(226, 232, 240, 0.5)', padding: '6px 14px', borderRadius: '20px' }}>
            {categories.length} صنف
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>إجمالي الوحدات</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3498db' }}>{totalItems.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>قيمة المخزون</div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#2ecc71' }}>{totalValue.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr' }}>
        {categories.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <AlertCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>المخزن فارغ حالياً.</p>
          </div>
        ) : categories.map((cat) => {
          const balance = parseFloat(cat.balance) || 0; 
          const price = parseFloat(cat.price) || 0; 
          const value = balance * price;
          const statusClass = balance <= 0 ? 'empty' : balance < 5 ? 'low' : 'available';
          const statusText = balance <= 0 ? 'منتهي' : balance < 5 ? 'منخفض' : 'متوفر';
          const borderColor = balance <= 0 ? '#ef4444' : balance < 5 ? '#f59e0b' : '#3b82f6';
          
          return (
            <div key={cat.id} className="glass-card" style={{ borderBottom: `4px solid ${borderColor}`, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>
                  <Box size={18} color={borderColor} />
                  {cat.name}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`status-badge ${statusClass}`}>{statusText}</span>
                  <button 
                    onClick={() => onDeleteItem(cat.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '6px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(248, 250, 252, 0.8)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCcw size={14} /> الرصيد:
                  </span>
                  <span style={{ fontWeight: '800', color: balance <= 0 ? '#ef4444' : '#1e293b' }}>
                    {balance} {cat.unit || 'وحدة'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Tag size={14} /> السعر:
                  </span>
                  <span style={{ fontWeight: '800', color: '#1e293b' }}>{price.toLocaleString()} ج.م</span>
                </div>
                <div style={{ borderTop: '2px dashed rgba(203, 213, 225, 0.5)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>قيمة المخزون:</span>
                  <span style={{ color: '#2ecc71', fontWeight: '900' }}>{value.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={onBack} className="btn-back" style={{ marginTop: '20px' }}>
        <ArrowRight size={20} /> العودة للرئيسية
      </button>
    </div>
  );
};

export default Inventory;
