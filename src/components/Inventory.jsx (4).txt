import React from 'react';
import { Box, Layers, AlertCircle, Tag, ArrowRight, RefreshCcw } from 'lucide-react';

const Inventory = ({ categories, onBack, onGoToGrid }) => {
  const styles = {
    container: { padding: '20px', direction: 'rtl', maxWidth: '900px', margin: '0 auto', fontFamily: "'Tajawal', sans-serif" },
    shelfTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' },
    shelfGrid: { display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' },
    shelfItem: (balance) => ({
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px',
      // تغيير لون الإطار بناءً على الكمية (أحمر إذا صفر، أصفر إذا قليل، أزرق إذا متوفر)
      borderBottom: `6px solid ${balance <= 0 ? '#ef4444' : balance < 5 ? '#f59e0b' : '#3b82f6'}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      position: 'relative',
      transition: 'transform 0.2s',
    }),
    itemName: { fontSize: '1.2rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' },
    dataContainer: { backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' },
    dataRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    label: { fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' },
    value: (color = '#1e293b') => ({ fontSize: '1.1rem', fontWeight: '800', color: color }),
    totalSection: { marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: (balance) => ({
      fontSize: '0.7rem',
      padding: '4px 8px',
      borderRadius: '20px',
      background: balance <= 0 ? '#fee2e2' : '#dcfce7',
      color: balance <= 0 ? '#ef4444' : '#10b981',
      fontWeight: 'bold'
    })
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={styles.shelfTitle}>
          <Layers size={28} color="#2563eb" />
          <span>إحصائيات المخازن المستمرة</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onGoToGrid}
            style={{ fontSize: '0.8rem', color: 'white', background: '#3b82f6', padding: '5px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            إدخال سريع (Excel)
          </button>
          <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#e2e8f0', padding: '5px 12px', borderRadius: '20px' }}>
             إجمالي الأصناف: {categories.length}
          </div>
        </div>
      </div>

      <div style={styles.shelfGrid}>
        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '50px', color: '#94a3b8' }}>
            <AlertCircle size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>المخزن فارغ حالياً. أي عملية شراء ستظهر هنا بشكل دائم.</p>
          </div>
        ) : (
          categories.map((cat) => {
            const currentBalance = cat.balance ?? cat.quantity ?? 0;
            return (
              <div key={cat.id} style={styles.shelfItem(currentBalance)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={styles.itemName}>
                    <Box size={20} color="#3b82f6" />
                    {cat.name}
                  </div>
                  <span style={styles.statusBadge(currentBalance)}>
                    {currentBalance <= 0 ? 'منتهي' : 'متوفر'}
                  </span>
                </div>

                <div style={styles.dataContainer}>
                  <div style={styles.dataRow}>
                    <span style={styles.label}><RefreshCcw size={14} /> الرصيد الحالي:</span>
                    <span style={styles.value(currentBalance <= 0 ? '#ef4444' : '#1e293b')}>
                      {currentBalance} {cat.unit || 'وحدة'}
                    </span>
                  </div>
                  
                  <div style={styles.dataRow}>
                    <span style={styles.label}><Tag size={14} /> سعر الوحدة:</span>
                    <span style={styles.value()}>{cat.price || 0} ج.م</span>
                  </div>

                  <div style={styles.totalSection}>
                    <span style={{fontSize: '0.85rem', fontWeight: 'bold'}}>قيمة المخزون:</span>
                    <span style={{color: '#10b981', fontWeight: '900'}}>
                      {(currentBalance * (cat.price || 0)).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <button onClick={onBack} style={{marginTop: '30px', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold'}}>
        <ArrowRight size={20} /> العودة للرئيسية
      </button>
    </div>
  );
};

export default Inventory;
