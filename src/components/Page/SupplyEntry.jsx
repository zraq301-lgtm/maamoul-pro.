import React, { useState } from 'react';
import { Package, Hash, DollarSign, Save, Truck, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const SupplyEntry = ({ onInventoryEntry, categories = [] }) => {
  const [formData, setFormData] = useState({
    item: '', 
    unit: 'كيلو', 
    quantity: '', 
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق من البيانات بنفس منطق PurchasesManager
    if (!formData.item || !formData.quantity || !formData.price) {
      Swal.fire('تنبيه', 'يرجى إكمال بيانات الصنف والكمية والسعر', 'warning');
      return;
    }

    // بناء الكائن الاحترافي الذي يطلبه App.js (بنفس مسميات handleSave)
    const supplyWithBatch = {
      ...formData,
      item: formData.item.trim(), // الاسم المطلوب لـ App.js
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      total: parseFloat(formData.quantity) * parseFloat(formData.price),
      id: Date.now(),
      paymentMethod: 'كاش', // افتراضي للتوريد المباشر
      batchInfo: {
        batchId: `B-${Date.now().toString().slice(-6)}`,
        purchaseDate: formData.date,
        costPerUnit: parseFloat(formData.price),
        supplier: 'توريد مباشر من المخزن'
      }
    };

    // إرسال البيانات للأب (onInventoryEntry هنا تمثل handleSavePurchase)
    onInventoryEntry(supplyWithBatch);

    // تنظيف الفورم
    setFormData({ item: '', unit: 'كيلو', quantity: '', price: '', date: new Date().toISOString().split('T')[0] });
    
    Swal.fire({
      icon: 'success',
      title: 'تمت الإضافة للمخزن',
      text: `رقم الشحنة الذكي: ${supplyWithBatch.batchInfo.batchId}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1e5631' }}>
          <Truck size={24} />
          <h3 style={{ margin: 0 }}>توريد مباشر للمخزن</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}><Package size={16} /> اسم الصنف</label>
          <input 
            className="glass-input" 
            style={inputStyle}
            placeholder="مثال: دقيق، سكر..." 
            value={formData.item}
            onChange={e => setFormData({...formData, item: e.target.value})}
            list="stock-items"
            required 
          />
          <datalist id="stock-items">
            {categories.map((c, i) => <option key={i} value={c.name || c.item} />)}
          </datalist>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div>
              <label style={labelStyle}><Hash size={16} /> الكمية</label>
              <input 
                type="number" step="any" style={inputStyle}
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={labelStyle}><DollarSign size={16} /> السعر</label>
              <input 
                type="number" step="any" style={inputStyle}
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                required 
              />
            </div>
          </div>

          <label style={{...labelStyle, marginTop: '10px'}}><Calendar size={16} /> التاريخ</label>
          <input 
            type="date" style={inputStyle}
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />

          <button type="submit" style={btnStyle}>
            <Save size={20} /> حفظ الشحنة في المخزن
          </button>
        </form>
      </div>
    </div>
  );
};

// التنسيقات المتوافقة مع ستايل ERP الخاص بك
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontSize: '14px', color: '#1e5631', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '15px', marginTop: '15px', background: '#1e5631', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' };

export default SupplyEntry;
