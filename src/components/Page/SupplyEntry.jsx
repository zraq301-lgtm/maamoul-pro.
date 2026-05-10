import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories = [] }) => {
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'كيلو' });

  const handleSubmit = (e) => {
    e.preventDefault();

    // تجهيز البيانات كـ JSON يطابق handleDirectStockAdd في App.js
    const dataToSend = {
      name: newItem.name.trim(),
      balance: parseFloat(newItem.balance),
      price: parseFloat(newItem.price) || 0,
      unit: newItem.unit,
      // تحديد الفئة ضروري لظهورها في التبويب الصحيح لاحقاً
      category: (newItem.name.includes("معمول") || newItem.name.includes("جاهز")) ? "منتج نهائي" : "خامات"
    };

    // إرسال البيانات للأب
    if (onInventoryEntry) {
      onInventoryEntry(dataToSend); 
      
      // تصفير الحقول بعد الإرسال الناجح
      setNewItem({ name: '', balance: '', price: '', unit: 'كيلو' });
      Swal.fire({ icon: 'success', title: 'تم الإرسال لـ App.js بنجاح', timer: 1500 });
    } else {
      console.error("عذراً، الدالة onInventoryEntry غير واصلة لهذا المكون!");
    }
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '20px' }}>
      <form onSubmit={handleSubmit}>
        <input 
          style={inputStyle} 
          placeholder="اسم الصنف" 
          value={newItem.name}
          onChange={e => setNewItem({...newItem, name: e.target.value})}
          list="items-list" required 
        />
        <datalist id="items-list">
          {categories.map((c, i) => <option key={i} value={c.name || c.item} />)}
        </datalist>
        
        <input 
          style={inputStyle} type="number" placeholder="الكمية" 
          value={newItem.balance}
          onChange={e => setNewItem({...newItem, balance: e.target.value})}
          required 
        />
        
        <input 
          style={inputStyle} type="number" placeholder="السعر" 
          value={newItem.price}
          onChange={e => setNewItem({...newItem, price: e.target.value})}
          required 
        />
        
        <button style={btnStyle} type="submit">تأكيد التوريد</button>
      </form>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' };
const btnStyle = { width: '100%', padding: '15px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

export default SupplyEntry;
