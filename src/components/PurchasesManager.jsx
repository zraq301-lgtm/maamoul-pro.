import React, { useState } from 'react';
import { Truck, ArrowRight, Save, ShoppingCart, Table, AlertTriangle } from 'lucide-react';
import DataGrid from './DataGrid';
import Swal from 'sweetalert2';

const PurchasesManager = ({ onBack, data, onSave }) => {
  const { stock = [], inventory = [], suppliers = [] } = data;
  const [activeView, setActiveView] = useState('menu');
  const [isNewItem, setIsNewItem] = useState(false);
  
  const [formData, setFormData] = useState({
    item: '', quantity: '', price: '',
    supplier: '', paymentMethod: 'كاش',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) {
      Swal.fire('خطأ', 'يرجى إكمال بيانات الفاتورة', 'error');
      return;
    }

    const total = parseFloat(formData.quantity) * parseFloat(formData.price);
    
    const purchaseOrder = {
      id: `INV-${Date.now()}`,
      date: formData.date,
      vendorId: formData.supplier || 'مورد عام',
      supplierName: formData.supplier || 'مورد عام',
      paymentMethod: formData.paymentMethod,
      status: 'completed',
      item: formData.item,
      quantity: formData.quantity,
      price: formData.price,
      total: total
    };

    // تنفيذ الحفظ عبر الدالة القادمة من App.jsx
    await onSave(purchaseOrder);
    
    // إعادة تعيين النموذج
    setFormData({ item: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] });
    setActiveView('menu');
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      
      {activeView === 'menu' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShoppingCart size={28} color="#1e5631" />
            <h2>نظام المشتريات</h2>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <button className="glass-card" onClick={() => setActiveView('entry')} style={{ width: '100%', textAlign: 'right', padding: '20px', borderRadius: '15px', border: 'none', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3>فاتورة مشتريات جديدة</h3>
            </button>
            <button className="glass-card" onClick={() => setActiveView('grid')} style={{ width: '100%', textAlign: 'right', padding: '20px', borderRadius: '15px', border: 'none', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3>سجل المشتريات</h3>
            </button>
          </div>
          <button onClick={onBack} style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }}>العودة</button>
        </>
      )}

      {activeView === 'entry' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px' }}>
          <h3 onClick={() => setActiveView('menu')} style={{ cursor: 'pointer' }}><ArrowRight /> رجوع</h3>
          <form onSubmit={handleSave}>
            <input className="input-field" placeholder="اسم الصنف" value={formData.item} onChange={(e) => setFormData({...formData, item: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
            <input type="number" className="input-field" placeholder="الكمية" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
            <input type="number" className="input-field" placeholder="السعر" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
            
            <select value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
              <option value="">اختر المورد...</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#1e5631', color: 'white', border: 'none', borderRadius: '10px' }}>حفظ الفاتورة</button>
          </form>
        </div>
      )}

      {activeView === 'grid' && (
        <div>
          <h3 onClick={() => setActiveView('menu')} style={{ cursor: 'pointer' }}><ArrowRight /> رجوع</h3>
          <DataGrid data={inventory} />
        </div>
      )}
    </div>
  );
};

export default PurchasesManager;
