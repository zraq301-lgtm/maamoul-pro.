import React, { useState } from 'react';
import {
  Package, Truck, Calendar, Hash, DollarSign,
  ArrowRight, Save, ShoppingCart, Clock
} from 'lucide-react';

const PurchasesManager = ({ onPurchaseComplete, onBack, stock = [], onOrderTrigger }) => {
  const [activeView, setActiveView] = useState('menu');
  const [formData, setFormData] = useState({
    item: '', unit: '', quantity: '', price: '', supplier: '',
    paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0]
  });

  const [orderRequest, setOrderRequest] = useState({
    item: '', currentStock: 0, daysLeft: 0, neededQty: 0
  });

  const handleItemSelect = (itemName) => {
    const itemInStock = stock.find(s => s.name === itemName);
    const balance = itemInStock ? itemInStock.balance : 0;
    const estimatedDays = Math.floor(balance / 2);
    setOrderRequest({ ...orderRequest, item: itemName, currentStock: balance, daysLeft: estimatedDays });
  };

  const handleSendToSuppliers = (e) => {
    e.preventDefault();
    const orderData = { ...orderRequest, id: Date.now(), status: 'في الانتظار', requestDate: new Date().toLocaleDateString() };
    if (onOrderTrigger) onOrderTrigger(orderData);
    alert(`تم إرسال طلب (${orderRequest.item}) إلى قائمة انتظار الموردين`);
    setActiveView('menu');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) {
      alert("يرجى إكمال بيانات الفاتورة");
      return;
    }
    const total = formData.quantity * formData.price;
    const finalData = { ...formData, total, id: Date.now() };
    onPurchaseComplete(finalData);
    alert(`تم تسجيل الشراء: ${formData.item} وإضافته للمخزن`);
    setFormData({ item: '', unit: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] });
    setActiveView('menu');
  };

  if (activeView === 'menu') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
        <div className="page-header">
          <ShoppingCart size={28} color="#e67e22" />
          <h2>إدارة المشتريات</h2>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div className="glass-card" onClick={() => setActiveView('entry')} style={{ cursor: 'pointer', textAlign: 'center', borderBottom: '5px solid #e67e22' }}>
            <Save size={32} color="#e67e22" />
            <h3 style={{ marginTop: '8px', marginBottom: '4px' }}>عملية شراء</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>إضافة أصناف جديدة للمخزن</p>
          </div>

          <div className="glass-card" onClick={() => setActiveView('orderRequest')} style={{ cursor: 'pointer', textAlign: 'center', borderBottom: '5px solid #f59e0b' }}>
            <ShoppingCart size={32} color="#f59e0b" />
            <h3 style={{ marginTop: '8px', marginBottom: '4px' }}>طلب شراء</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>إرسال احتياج لقسم الموردين</p>
          </div>
        </div>

        <button onClick={onBack} className="btn-back" style={{ marginTop: '20px' }}>
          <ArrowRight size={18} /> العودة للوحة التحكم
        </button>
      </div>
    );
  }

  if (activeView === 'orderRequest') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
        <div className="page-header">
          <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: 'rgba(226, 232, 240, 0.5)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowRight size={20} />
          </button>
          <h3 style={{ margin: 0 }}>إنشاء طلب احتياج</h3>
        </div>

        <div className="glass-card">
          <form onSubmit={handleSendToSuppliers}>
            <label className="form-label">اختر الصنف</label>
            <select className="glass-input" required onChange={e => handleItemSelect(e.target.value)} style={{ marginBottom: '12px' }}>
              <option value="">اختر صنف من المخزن...</option>
              {stock.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>

            <div style={{ background: 'rgba(255, 248, 237, 0.8)', padding: '14px', borderRadius: '14px', marginBottom: '12px', border: '1px solid rgba(254, 235, 200, 0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}><Package size={14} /> الرصيد الحالي:</span>
                <strong>{orderRequest.currentStock}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: orderRequest.daysLeft < 3 ? '#e74c3c' : '#1e293b', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> يكفي لمدة تقريبية:</span>
                <strong>{orderRequest.daysLeft} يوم</strong>
              </div>
            </div>

            <label className="form-label"><Hash size={16} /> الكمية المطلوبة</label>
            <input type="number" className="glass-input" placeholder="الكمية المراد طلبها" required onChange={e => setOrderRequest({ ...orderRequest, neededQty: e.target.value })} style={{ marginBottom: '15px' }} />

            <button type="submit" className="btn-primary" style={{ backgroundColor: '#f59e0b', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
              <Truck size={20} /> تنفيذ الطلب (إرسال للموردين)
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeView === 'entry') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
        <div className="page-header">
          <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: 'rgba(226, 232, 240, 0.5)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <ArrowRight size={20} />
          </button>
          <h3 style={{ margin: 0 }}>تسجيل فاتورة شراء</h3>
        </div>

        <div className="glass-card">
          <form onSubmit={handleSave}>
            <label className="form-label"><Package size={16} color="#e67e22" /> اسم الصنف</label>
            <input className="glass-input" placeholder="مثال: دقيق" required value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} style={{ marginBottom: '10px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">الوحدة</label>
                <input className="glass-input" placeholder="كيلو/كرتونة" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ marginBottom: '10px' }} />
              </div>
              <div>
                <label className="form-label"><Hash size={16} color="#e67e22" /> الكمية</label>
                <input type="number" className="glass-input" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={{ marginBottom: '10px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label"><DollarSign size={16} color="#e67e22" /> سعر الوحدة</label>
                <input type="number" className="glass-input" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ marginBottom: '10px' }} />
              </div>
              <div>
                <label className="form-label">طريقة السداد</label>
                <select className="glass-input" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} style={{ marginBottom: '10px' }}>
                  <option value="كاش">كاش</option>
                  <option value="آجل">آجل</option>
                </select>
              </div>
            </div>

            <label className="form-label"><Truck size={16} color="#e67e22" /> اسم المورد</label>
            <input className="glass-input" placeholder="اختياري" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} style={{ marginBottom: '10px' }} />

            <label className="form-label"><Calendar size={16} color="#e67e22" /> التاريخ</label>
            <input type="date" className="glass-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ marginBottom: '15px' }} />

            {formData.quantity && formData.price && (
              <div style={{ background: 'rgba(255, 248, 237, 0.8)', padding: '14px', borderRadius: '14px', marginBottom: '15px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>إجمالي الفاتورة: </span>
                <strong style={{ fontSize: '1.2rem', color: '#e67e22' }}>{(parseFloat(formData.quantity) * parseFloat(formData.price)).toLocaleString()}</strong>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ backgroundColor: '#e67e22', boxShadow: '0 4px 15px rgba(230, 126, 34, 0.3)' }}>
              <Save size={20} /> تسجيل وإضافة للمخزن
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default PurchasesManager;
