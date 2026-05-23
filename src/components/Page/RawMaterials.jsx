import React from 'react';
import { Trash2 } from 'lucide-react';

const RawMaterials = ({ categories = [], onDeleteItem }) => {
  // الاعتماد على التصفية الذكية الممررة مباشرة من المخزن لضمان عرض الرصيد المخصوم فعلياً
  const rawData = categories;

  return (
    <div style={{ padding: '10px' }}>
      {rawData.length > 0 ? rawData.map(item => (
        <div key={item.id || item.name} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{item.name}</h3>
            {onDeleteItem && (
              /* تم تعديل سطر الضغطة هنا لتمرير id العنصر مع كلمة 'stock' لربطه بنظام الحذف الاحترافي الموحد */
              <Trash2 size={18} color="#ef4444" onClick={() => onDeleteItem(item.id, 'stock')} style={{ cursor: 'pointer' }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#666' }}>
            {/* هنا يظهر الرصيد الفعلي المخصوم بعد عملية الإنتاج */}
            <span>الرصيد: <b style={{ color: item.balance > 0 ? '#10b981' : '#ef4444' }}>{item.balance || 0}</b></span>
            <span>السعر: <b>{item.price || 0} ج.م</b></span>
          </div>
        </div>
      )) : <p style={{ textAlign: 'center', color: '#64748b' }}>لا توجد خامات حالياً</p>}
    </div>
  );
};

const cardStyle = { 
  background: '#fff', 
  padding: '15px', 
  borderRadius: '15px', 
  marginBottom: '10px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
};

export default RawMaterials;
