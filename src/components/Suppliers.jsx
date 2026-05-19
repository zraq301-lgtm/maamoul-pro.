import React, { useState } from 'react';
import { Truck, UserPlus, Phone, Save, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const Suppliers = ({ onBack, onSaveSupplier, suppliers = [], waitingList = [], onPayDebt, onUpdateWaitingList }) => {
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '', material: 'دقيق', debt: 0 });
  const [payAmount, setPayAmount] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // مؤشر لانتظار عملية المعالجة

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) { 
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى إدخال اسم المورد ورقم الهاتف أولاً',
        icon: 'warning',
        confirmButtonText: 'حسناً'
      });
      return; 
    }
    
    setIsSaving(true);
    
    // 🎯 1. هيكلة وتجهيز البيانات بالمعرفات والأرقام الصحيحة المتوافقة مع السيرفر السحابي
    const supplierId = Date.now().toString();
    const supplierPayload = { 
      id: supplierId,
      record_id: `sup_${supplierId}`, // لتسهيل الفهرسة السحابية إذا كان الـ App.jsx يحتاجها
      name: newSupplier.name.trim(),
      phone: newSupplier.phone.trim(),
      address: newSupplier.address ? newSupplier.address.trim() : '',
      material: newSupplier.material, 
      debt: parseFloat(newSupplier.debt) || 0 
    };

    try {
      // 🚀 2. استدعاء الدالة الأب الممررة من App.jsx مباشرة والانتظار حتى تمام الرفع سحابياً
      if (onSaveSupplier) {
        await onSaveSupplier(supplierPayload);
      }
      
      // 3. إعادة تعيين واجهة النموذج بعد التأكد من نجاح العملية السحابية بالـ App
      setNewSupplier({ name: '', phone: '', address: '', material: 'دقيق', debt: 0 });
      setShowAdd(false);
      
      Swal.fire({
        title: 'تم الحفظ',
        text: 'تم تمرير البيانات وحفظها بنجاح عبر نظام الروابط السحابية 🚀',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        position: 'center',
        toast: true
      });
    } catch (error) {
      console.error("🚨 Error process supplier save:", error);
      Swal.fire({
        title: 'فشل الحفظ',
        text: 'حدث خطأ أثناء محاولة حفظ البيانات، يرجى التحقق من الاتصال.',
        icon: 'error',
        confirmButtonText: 'موافق'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayDebt = (supplierName) => {
    const amount = parseFloat(payAmount[supplierName]);
    if (!amount || amount <= 0) { 
      Swal.fire({ title: 'خطأ', text: 'يرجى إدخال مبلغ صحيح للسداد', icon: 'error', confirmButtonText: 'حسناً' });
      return; 
    }
    
    if (onPayDebt) onPayDebt(supplierName, amount);
    setPayAmount(prev => ({ ...prev, [supplierName]: '' }));
    
    Swal.fire({
      title: 'تم السداد',
      text: `تم سداد ${amount.toLocaleString()} ج.م من حساب ${supplierName}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      position: 'center',
      toast: true
    });
  };

  const handleRemoveOrder = (orderId) => { 
    if (onUpdateWaitingList) onUpdateWaitingList(waitingList.filter(o => o.id !== orderId)); 
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      
      {/* الهيدر */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Truck size={28} color="#34495e" />
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>إدارة الموردين</h2>
      </div>
      
      {/* زر فتح وإغلاق النموذج بمظهر مرن */}
      <button 
        onClick={() => setShowAdd(!showAdd)} 
        className="btn-primary" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#34495e', marginBottom: '15px', width: '100%', boxShadow: '0 4px 15px rgba(52, 73, 94, 0.3)' }}
      >
        <UserPlus size={20} /> {showAdd ? 'إغلاق النموذج' : 'إضافة مورد جديد'}
      </button>
      
      {/* نموذج الإضافة */}
      {showAdd && (
        <div className="glass-card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: '15px', color: '#1e293b' }}>بيانات المورد الجديد</h3>
          <form onSubmit={handleSubmit}>
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>اسم المورد / الشركة</label>
            <input className="glass-input" placeholder="مثال: شركة الأمل للدقيق" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} style={{ marginBottom: '12px', width: '100%' }} disabled={isSaving} />
            
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}><Phone size={14} /> رقم التواصل</label>
            <input className="glass-input" placeholder="01xxxxxxxxx" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={{ marginBottom: '12px', width: '100%' }} disabled={isSaving} />
            
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>المادة الموردة</label>
            <select className="glass-input" value={newSupplier.material} onChange={(e) => setNewSupplier({ ...newSupplier, material: e.target.value })} style={{ marginBottom: '12px', width: '100%' }} disabled={isSaving}><option value="دقيق">دقيق</option><option value="سمن">سمن</option><option value="عجوة">عجوة</option><option value="تغليف">كراتين وتغليف</option><option value="سكر">سكر</option><option value="أخرى">أخرى</option></select>
            
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}><DollarSign size={14} /> المديونية السابقة</label>
            <input type="number" className="glass-input" placeholder="0" value={newSupplier.debt} onChange={(e) => setNewSupplier({ ...newSupplier, debt: e.target.value })} style={{ marginBottom: '20px', width: '100%' }} disabled={isSaving} />
            
            <button type="submit" className="btn-primary" style={{ backgroundColor: '#34495e', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isSaving}>
              <Save size={18} /> {isSaving ? 'جاري الحفظ والمزامنة السحابية...' : 'حفظ وتأمين البيانات'}
            </button>
          </form>
        </div>
      )}
      
      {/* قائمة الموردين */}
      <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '12px' }}>قائمة الموردين ({suppliers.length})</h3>
      {suppliers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
          <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>لا يوجد موردين مسجلين</p>
        </div>
      ) : suppliers.map(s => (
        <div key={s.id} className="glass-card" style={{ marginBottom: '10px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b' }}>{s.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{s.material} | {s.phone}</div>
            </div>
            {(s.debt || 0) > 0 && <span className="status-badge" style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>مدين: {(parseFloat(s.debt) || 0).toLocaleString()} ج.م</span>}
          </div>
          {(s.debt || 0) > 0 && onPayDebt && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input type="number" className="glass-input" placeholder="مبلغ السداد" value={payAmount[s.name] || ''} onChange={(e) => setPayAmount(prev => ({ ...prev, [s.name]: e.target.value }))} style={{ marginBottom: 0, flex: 1 }} />
              <button onClick={() => handlePayDebt(s.name)} style={{ padding: '12px 16px', borderRadius: '14px', border: 'none', backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>سداد</button>
            </div>
          )}
        </div>
      ))}
      
      {/* طلبات الشراء المعلقة */}
      {waitingList && waitingList.length > 0 && (
        <>
          <h3 style={{ fontSize: '1.1rem', color: '#f59e0b', marginTop: '20px', marginBottom: '12px' }}>طلبات الشراء المعلقة ({waitingList.length})</h3>
          {waitingList.map(order => (
            <div key={order.id} className="glass-card" style={{ marginBottom: '8px', padding: '12px', borderRight: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{order.item}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>مطلوب: {order.neededQty} | الحالة: {order.status}</div>
                </div>
                <button onClick={() => handleRemoveOrder(order.id)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}>حذف</button>
              </div>
            </div>
          ))}
        </>
      )}
      
      {/* العودة للرئيسية */}
      <button onClick={onBack} className="btn-back" style={{ marginTop: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <ArrowRight size={18} /> العودة للوحة التحكم
      </button>
    </div>
  );
};

export default Suppliers;
