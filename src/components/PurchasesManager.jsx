import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, Hash, DollarSign, ArrowRight, Save, ShoppingCart, Clock, Bell } from 'lucide-react';
// استيراد الإشعارات المحلية للأندرويد
import { LocalNotifications } from '@capacitor/local-notifications';

const PurchasesManager = ({ onPurchaseComplete, onBack, stock = [], onOrderTrigger }) => {
  const [activeView, setActiveView] = useState('menu');
  const [formData, setFormData] = useState({ 
    item: '', unit: '', quantity: '', price: '', 
    supplier: '', paymentMethod: 'كاش', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [orderRequest, setOrderRequest] = useState({ item: '', currentStock: 0, daysLeft: 0, neededQty: 0 });

  // تفعيل الإشعارات عند بدء المكون
  useEffect(() => {
    LocalNotifications.requestPermissions();
  }, []);

  // دالة إرسال التنبيه للأندرويد
  const sendAndroidNotification = async (itemName, balance) => {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "⚠️ تنبيه نقص مخزون",
          body: `الصنف (${itemName}) وصل رصيده إلى ${balance} فقط. يرجى طلب شراء جديد.`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) }, // يظهر بعد ثانية
          sound: 'beep.wav',
          actionTypeId: "",
          extra: null
        }
      ]
    });
  };

  const handleItemSelect = (itemName) => {
    const itemInStock = stock.find(s => s.name === itemName);
    const balance = itemInStock ? itemInStock.balance : 0;
    
    // تنبيه ERP: إذا كان الرصيد أقل من 5 كيلو مثلاً
    if (balance < 5) {
      sendAndroidNotification(itemName, balance);
    }

    setOrderRequest({ 
      ...orderRequest, 
      item: itemName, 
      currentStock: balance, 
      daysLeft: Math.floor(balance / 2) // افتراض استهلاك 2 كيلو يومياً
    });
  };

  const handleSendToSuppliers = (e) => {
    e.preventDefault();
    if (onOrderTrigger) {
      onOrderTrigger({ 
        ...orderRequest, 
        id: Date.now(), 
        status: 'في الانتظار', 
        requestDate: new Date().toLocaleDateString(),
        type: 'ERP_ORDER' 
      });
    }
    alert(`تم إرسال طلب (${orderRequest.item}) لقسم الموردين بنجاح`); 
    setActiveView('menu');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.price) { 
      alert("يرجى إكمال بيانات الفاتورة"); return; 
    }

    // هيكلة البيانات بنظام ERP (إضافة Batch)
    const purchaseWithBatch = {
      ...formData,
      total: formData.quantity * formData.price,
      id: Date.now(),
      batchInfo: {
        batchId: `B-${Date.now().toString().slice(-6)}`,
        purchaseDate: formData.date,
        costPerUnit: parseFloat(formData.price),
        supplier: formData.supplier || 'مورد عام'
      }
    };

    onPurchaseComplete(purchaseWithBatch);
    alert(`✅ تم الحفظ وإضافة شحنة جديدة للمخزن برقم ${purchaseWithBatch.batchInfo.batchId}`);
    setFormData({ item: '', unit: '', quantity: '', price: '', supplier: '', paymentMethod: 'كاش', date: new Date().toISOString().split('T')[0] }); 
    setActiveView('menu');
  };

  if (activeView === 'menu') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
        <div className="page-header">
          <ShoppingCart size={28} color="#e67e22" />
          <h2 style={{margin:0}}>نظام المشتريات ERP</h2>
        </div>
        
        {/* ملخص ذكي */}
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={20} color="#d97706" />
          <span style={{ fontSize: '0.8rem', color: '#92400e' }}>سيقوم النظام بإخطارك عبر الأندرويد عند نقص الخامات.</span>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div className="glass-card" onClick={() => setActiveView('entry')} style={{ cursor: 'pointer', textAlign: 'right', borderRight: '8px solid #e67e22', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '12px' }}><Save size={24} color="#e67e22" /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>فاتورة مشتريات</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>دخول خامات جديدة للمخزن</p>
            </div>
          </div>

          <div className="glass-card" onClick={() => setActiveView('orderRequest')} style={{ cursor: 'pointer', textAlign: 'right', borderRight: '8px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '12px' }}><Truck size={24} color="#f59e0b" /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>طلب احتياج</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>تنبيه الموردين بالنواقص</p>
            </div>
          </div>
        </div>

        <button onClick={onBack} className="btn-back" style={{ marginTop: '20px' }}><ArrowRight size={18} /> العودة للوحة التحكم</button>
      </div>
    );
  }

  // --- واجهة طلب الشراء (Order Request) ---
  if (activeView === 'orderRequest') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', minHeight: '100vh' }}>
        <div className="page-header">
          <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}><ArrowRight size={20} /></button>
          <h3 style={{ margin: 0 }}>ERP - طلب احتياج</h3>
        </div>
        <div className="glass-card">
          <form onSubmit={handleSendToSuppliers}>
            <label className="form-label">الصنف المطلوب</label>
            <select className="glass-input" required onChange={e => handleItemSelect(e.target.value)} style={{ marginBottom: '12px' }}>
              <option value="">اختر صنف من المخزن...</option>
              {stock.map(s => <option key={s.id} value={s.name}>{s.name} (رصيد: {s.balance})</option>)}
            </select>
            
            {orderRequest.item && (
              <div style={{ background: orderRequest.currentStock < 5 ? '#fef2f2' : '#f0f9ff', padding: '14px', borderRadius: '14px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{fontSize:'0.8rem'}}>الرصيد المتاح:</span>
                  <strong style={{color: orderRequest.currentStock < 5 ? '#ef4444' : '#1e293b'}}>{orderRequest.currentStock}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{fontSize:'0.8rem'}}>الاستهلاك المتوقع:</span>
                  <strong>{orderRequest.daysLeft} أيام</strong>
                </div>
              </div>
            )}

            <label className="form-label">الكمية المطلوبة</label>
            <input type="number" className="glass-input" placeholder="الكمية المطلوبة من المورد" required onChange={e => setOrderRequest({ ...orderRequest, neededQty: e.target.value })} style={{ marginBottom: '15px' }} />
            <button type="submit" className="btn-primary" style={{ backgroundColor: '#f59e0b' }}><Truck size={20} /> إرسال للموردين</button>
          </form>
        </div>
      </div>
    );
  }

  // --- واجهة تسجيل الشراء (Entry) ---
  if (activeView === 'entry') {
    return (
      <div style={{ padding: '15px', direction: 'rtl', minHeight: '100vh' }}>
        <div className="page-header">
          <button onClick={() => setActiveView('menu')} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}><ArrowRight size={20} /></button>
          <h3 style={{ margin: 0 }}>تسجيل وارد (ERP)</h3>
        </div>
        <div className="glass-card">
          <form onSubmit={handleSave}>
            <label className="form-label">الصنف</label>
            <input className="glass-input" placeholder="دقيق، سكر..." required value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} style={{ marginBottom: '10px' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label className="form-label">الكمية</label><input type="number" className="glass-input" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={{ marginBottom: '10px' }} /></div>
              <div><label className="form-label">سعر الوحدة</label><input type="number" className="glass-input" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ marginBottom: '10px' }} /></div>
            </div>

            <label className="form-label">المورد</label>
            <input className="glass-input" placeholder="اسم الشركة أو المورد" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} style={{ marginBottom: '10px' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom:'15px' }}>
              <div>
                <label className="form-label">الدفع</label>
                <select className="glass-input" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  <option value="كاش">كاش</option>
                  <option value="آجل">آجل</option>
                </select>
              </div>
              <div>
                <label className="form-label">التاريخ</label>
                <input type="date" className="glass-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>

            {formData.quantity && formData.price && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>إجمالي الفاتورة: </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71' }}>{(formData.quantity * formData.price).toLocaleString()} ج.م</span>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ backgroundColor: '#e67e22' }}><Save size={20} /> ترحيل للمخزن والمالية</button>
          </form>
        </div>
      </div>
    );
  }
  return null;
};

export default PurchasesManager;
