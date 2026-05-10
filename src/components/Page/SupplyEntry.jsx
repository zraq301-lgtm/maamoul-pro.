import React, { useState } from 'react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories = [] }) => {
  const [newItem, setNewItem] = useState({ name: '', balance: '', price: '', unit: 'كيلو' });

  const handleSubmit = (e) => {
    e.preventDefault();

    const itemName = newItem.name.trim();
    // تحديد الفئة فوراً بناءً على الاسم لضمان الظهور في الصفحة الصحيحة
    const isFinished = itemName.includes("معمول") || itemName.includes("جاهز");

    // بناء كائن البيانات بجميع المسميات المحتملة لضمان التوافق مع App.js
    const purchaseData = {
      id: Date.now(),
      name: itemName,         // للمخزن الجديد
      item: itemName,         // للمشتريات القديمة
      balance: parseFloat(newItem.balance),  // الرصيد الحالي
      quantity: parseFloat(newItem.balance), // الكمية المضافة
      price: parseFloat(newItem.price),
      unit: newItem.unit,
      category: isFinished ? 'finished' : 'raw', // التصنيف ضروري جداً للفلتر
      date: new Date().toISOString().split('T')[0],
      type: 'ERP_SUPPLY',
      batchInfo: {
        batchId: `B-${Date.now().toString().slice(-5)}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        costPerUnit: parseFloat(newItem.price),
        supplier: 'توريد داخلي'
      }
    };

    try {
      if (!purchaseData.name || isNaN(purchaseData.quantity)) {
        throw new Error("بيانات غير مكتملة");
      }

      // إرسال البيانات المكتملة
      onInventoryEntry(purchaseData); 

      // تصفير الحقول
      setNewItem({ name: '', balance: '', price: '', unit: 'كيلو' });
      
      Swal.fire({
        icon: 'success',
        title: 'تم التوريد بنجاح',
        text: `رقم الشحنة: ${purchaseData.batchInfo.batchId}`,
        timer: 2000
      });
    } catch (error) {
      Swal.fire('خطأ', 'تأكد من إدخال الاسم والكمية بشكل صحيح', 'error');
    }
  };

  const inputStyle = { 
    width: '100%', padding: '15px', marginBottom: '15px', 
    borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' 
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#1e293b' }}>تسجيل توريد للمخزن</h3>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>اسم الصنف</label>
        <input 
          style={inputStyle} 
          placeholder="مثال: دقيق، معمول فستق..." 
          value={newItem.name}
          onChange={e => setNewItem({...newItem, name: e.target.value})}
          list="prev-items-list" 
          required 
        />
        <datalist id="prev-items-list">
          {categories.map((c, i) => (
            <option key={i} value={c.name || c.item} />
          ))}
        </datalist>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>الكمية</label>
            <input 
              style={inputStyle} type="number" step="any"
              value={newItem.balance}
              onChange={e => setNewItem({...newItem, balance: e.target.value})}
              required 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>السعر</label>
            <input 
              style={inputStyle} type="number" step="any"
              value={newItem.price}
              onChange={e => setNewItem({...newItem, price: e.target.value})}
              required 
            />
          </div>
        </div>

        <button 
          style={{ 
            width: '100%', padding: '15px', background: '#22c55e', 
            color: '#fff', border: 'none', borderRadius: '15px', 
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' 
          }} 
          type="submit"
        >
          تأكيد الإضافة للمخزن
        </button>
      </form>
    </div>
  );
};

export default SupplyEntry;
