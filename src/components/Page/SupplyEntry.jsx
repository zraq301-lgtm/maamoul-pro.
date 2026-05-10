import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories = [] }) => {
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'كيلو' });

  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق الدقيق لمنع رسالة الخطأ في المتصفح
    if (!newItem.name.trim() || isNaN(parseFloat(newItem.balance))) {
      Swal.fire('تنبيه', 'يرجى إدخال اسم الصنف والكمية بشكل صحيح', 'error');
      return;
    }

    // تجهيز البيانات وفقاً لمتطلبات App.jsx (handleDirectStockAdd)
    const stockObject = {
      name: newItem.name.trim(),
      balance: parseFloat(newItem.balance),
      price: parseFloat(newItem.price) || 0,
      unit: newItem.unit,
      // إضافة التصنيف لضمان ظهوره في صفحة "الخامات" أو "المنتجات"
      category: (newItem.name.includes("معمول") || newItem.name.includes("جاهز")) ? "منتج نهائي" : "خامات"
    };

    // تنفيذ الإرسال لـ App.js
    onInventoryEntry(stockObject);

    // إعادة ضبط الحقول
    setNewItem({ name: '', balance: '', price: '', unit: 'كيلو' });
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ textAlign: 'center', color: '#1e293b' }}>تسجيل توريد للمخزن</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>اسم الصنف</label>
          <input
            style={inputStyle}
            placeholder="مثال: دقيق، سكر، معمول..."
            value={newItem.name}
            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
            list="items-list"
            required
          />
          <datalist id="items-list">
            {categories.map((c, i) => <option key={i} value={c.name} />)}
          </datalist>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>الكمية</label>
            <input
              style={inputStyle}
              type="number"
              step="any"
              value={newItem.balance}
              onChange={e => setNewItem({ ...newItem, balance: e.target.value })}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>سعر الوحدة</label>
            <input
              style={inputStyle}
              type="number"
              step="any"
              value={newItem.price}
              onChange={e => setNewItem({ ...newItem, price: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" style={btnStyle}>إضافة للمخزن فوراً</button>
      </form>
    </div>
  );
};

// التنسيقات لضمان مظهر احترافي
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '13px', color: '#64748b', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '15px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };

export default SupplyEntry;
