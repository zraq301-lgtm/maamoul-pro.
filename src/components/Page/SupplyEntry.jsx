import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories }) => {
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'كيلو' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // التحقق من أن البيانات مطابقة لما يتوقعه App.js
    const purchaseData = {
      id: Date.now(),
      name: newItem.name.trim(), // الاسم كما هو
      balance: parseFloat(newItem.balance), // الرصيد
      price: parseFloat(newItem.price),
      unit: newItem.unit,
      date: new Date().toISOString().split('T')[0],
      batchInfo: { batchId: `B-${Date.now().toString().slice(-5)}` }
    };

    onInventoryEntry(purchaseData); // الإرسال لـ App
    setNewItem({ name: '', balance: '', price: '', unit: 'كيلو' });
    Swal.fire('تم التوريد', 'تمت إضافة المادة للمخزن بنجاح', 'success');
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '20px' }}>
      <h3>تسجيل توريد جديد</h3>
      <form onSubmit={handleSubmit}>
        <input 
          style={inputStyle} 
          placeholder="اسم الصنف (دقيق، سكر...)" 
          value={newItem.name}
          onChange={e => setNewItem({...newItem, name: e.target.value})}
          list="items-list" required 
        />
        <datalist id="items-list">
          {categories.map((c, i) => <option key={i} value={c.name} />)}
        </datalist>
        <input 
          style={inputStyle} type="number" placeholder="الكمية" 
          value={newItem.balance}
          onChange={e => setNewItem({...newItem, balance: e.target.value})}
          required 
        />
        <input 
          style={inputStyle} type="number" placeholder="سعر الوحدة" 
          value={newItem.price}
          onChange={e => setNewItem({...newItem, price: e.target.value})}
          required 
        />
        <button style={btnStyle} type="submit">تأكيد الإضافة للمخزن</button>
      </form>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' };
const btnStyle = { width: '100%', padding: '15px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' };

export default SupplyEntry;
