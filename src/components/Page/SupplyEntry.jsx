import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories = [] }) => {
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'كيلو' });

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. التحقق من البيانات قبل الإرسال لمنع ظهور رسالة الخطأ
    if (!newItem.name.trim() || !newItem.balance || parseFloat(newItem.balance) <= 0) {
      Swal.fire('خطأ', 'تأكد من إدخال الاسم والكمية بشكل صحيح', 'error');
      return;
    }

    // 2. تجهيز البيانات بالصيغة التي يفهمها App.js تماماً
    const stockData = {
      name: newItem.name.trim(),
      balance: parseFloat(newItem.balance),
      price: parseFloat(newItem.price) || 0,
      unit: newItem.unit,
      category: (newItem.name.includes("معمول") || newItem.name.includes("جاهز")) ? "منتج نهائي" : "خامات"
    };

    // 3. إرسال البيانات (onInventoryEntry هنا هي نفسها handleDirectStockAdd الممرة من App)
    onInventoryEntry(stockData);

    // تصفير الحقول ونجاح العملية
    setNewItem({ name: '', balance: '', price: '', unit: 'كيلو' });
  };

  return (
    <div style={{ padding: '15px', background: '#fff', borderRadius: '20px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '15px', textAlign: 'center' }}>إضافة سريعة للمخزن</h3>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="اسم الصنف الجديد أو الحالي"
          style={inputStyle}
          value={newItem.name}
          onChange={e => setNewItem({ ...newItem, name: e.target.value })}
          list="existing-items"
          required
        />
        <datalist id="existing-items">
          {categories.map((c, i) => <option key={i} value={c.name} />)}
        </datalist>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            placeholder="الكمية"
            style={inputStyle}
            value={newItem.balance}
            onChange={e => setNewItem({ ...newItem, balance: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="سعر التكلفة"
            style={inputStyle}
            value={newItem.price}
            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
            required
          />
        </div>

        <button type="submit" style={btnStyle}>تسجيل وإضافة للمخزن</button>
      </form>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' };
const btnStyle = { width: '100%', padding: '15px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

export default SupplyEntry;
