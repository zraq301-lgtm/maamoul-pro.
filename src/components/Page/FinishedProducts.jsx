import React from 'react';
import { Trash2 } from 'lucide-react';

const FinishedProducts = ({ categories, onDeleteItem }) => {
  // تم إلغاء تصفية الأسماء والاعتماد على المنتجات القادمة مباشرة بالكامل دون قيود
  const finishedData = categories || [];

  return (
    <div style={{ padding: '10px' }}>
      {finishedData.length > 0 ? finishedData.map(item => (
        <div key={item.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>{item.name}</h3>
            {/* تم ربط الدالة بـ 'stock' لتعمل بتوافق كامل مع السيرفر والـ App.jsx */}
            <Trash2 size={18} color="#ef4444" onClick={() => onDeleteItem && onDeleteItem(item.id, 'stock')} style={{ cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#666' }}>
            <span>المتوفر: <b>{item.balance}</b> علبة</span>
            <span>السعر: <b>{item.price}</b></span>
          </div>
        </div>
      )) : <p style={{ textAlign: 'center' }}>لا توجد منتجات جاهزة حالياً</p>}
    </div>
  );
};

const cardStyle = { background: '#fff', padding: '15px', borderRadius: '15px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default FinishedProducts;
