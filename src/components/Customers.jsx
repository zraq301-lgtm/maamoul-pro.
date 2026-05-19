import React, { useState } from 'react';
import { Users, UserPlus, Phone, Search, ArrowRight, MapPin, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

// 🎯 تم تعديل مستقبل الـ Props ليكون onSaveCustomer ليتطابق 100% مع ملف App.jsx
const Customers = ({ onBack, customers = [], onSaveCustomer }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCust, setNewCust] = useState({ name: '', phone: '', address: '' });

  const filteredCustomers = customers.filter(c => 
    (c.name || '').includes(searchTerm) || (c.phone || '').includes(searchTerm)
  );

  // 🔥 تحويل الدالة إلى async لتطبيق منطق الحفظ السحابي والانتظار المحترف
  const handleAdd = async () => {
    if (!newCust.name) { 
      Swal.fire({
        title: 'تنبيه',
        text: 'يرجى إدخال اسم العميل أولاً',
        icon: 'warning',
        confirmButtonText: 'حسناً',
        customClass: { popup: 'swal-custom' }
      });
      return; 
    }

    // 1️⃣ إظهار مؤشر التحميل أثناء الاتصال بالسيرفر
    Swal.fire({
      title: 'جاري الحفظ السحابي...',
      text: 'يتم الآن تأمين ورفع بيانات العميل الجديد',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 2️⃣ استدعاء الدالة وانتظار تنفيذها (إذا كانت ترفع إلى قاعدة بيانات أو سيرفر)
      await onSaveCustomer({ ...newCust, id: Date.now() }); 
      
      // 3️⃣ تصفير الحقول وإغلاق الواجهة بعد النجاح
      setNewCust({ name: '', phone: '', address: '' }); 
      setShowAdd(false); 

      // 4️⃣ تنبيه نجاح متناسق ومحترف بعد اكتمال الرفع
      Swal.fire({
        title: 'تمت الإضافة السحابية',
        text: 'تم حفظ العميل وتأمين بياناته بنجاح 🚀',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        position: 'center',
        toast: true
      });

    } catch (error) {
      // 5️⃣ التعامل مع حالات فشل الاتصال بالسيرفر أو انقطاع الإنترنت
      console.error("خطأ في حفظ العميل:", error);
      Swal.fire({
        title: 'فشل الحفظ',
        text: 'حدث خطأ أثناء مزامنة البيانات سحابياً، يرجى المحاولة لاحقاً',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
    }
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      
      {/* الرأس الهيدر */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Users size={28} color="#27ae60" />
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>إدارة العملاء</h2>
      </div>

      {!showAdd ? (
        <>
          {/* محرك البحث السريع */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search style={{ position: 'absolute', right: '14px', top: '14px', color: '#94a3b8' }} size={20} />
            <input 
              className="glass-input" 
              placeholder="ابحث عن عميل بالاسم أو الرقم..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ paddingRight: '42px', width: '100%' }} 
            />
          </div>

          {/* زر فتح نافذة عميل جديد */}
          <button 
            onClick={() => setShowAdd(true)} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#27ae60', marginBottom: '15px', width: '100%', boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)' }}
          >
            <UserPlus size={20} /> إضافة عميل جديد
          </button>

          {/* عرض الكروت والعملاء */}
          {filteredCustomers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
              <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>لا يوجد عملاء مسجلين</p>
            </div>
          ) : filteredCustomers.map(c => (
            <div key={c.id} className="glass-card" style={{ marginBottom: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Phone size={12} /> {c.phone}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {c.address || '-'}
              </div>
            </div>
          ))}
        </>
      ) : (
        /* واجهة إضافة البيانات الجديدة */
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1e293b' }}>بيانات العميل الجديد</h3>
          
          <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}>الاسم الكامل</label>
          <input className="glass-input" placeholder="اسم العميل" value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} style={{ marginBottom: '12px', width: '100%' }} />
          
          <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}><Phone size={14} /> رقم الموبايل</label>
          <input className="glass-input" placeholder="01xxxxxxxxx" value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} style={{ marginBottom: '12px', width: '100%' }} />
          
          <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '5px' }}><MapPin size={14} /> العنوان / المنطقة</label>
          <input className="glass-input" placeholder="مثال: المعادي" value={newCust.address} onChange={e => setNewCust({ ...newCust, address: e.target.value })} style={{ marginBottom: '20px', width: '100%' }} />
          
          <button onClick={handleAdd} className="btn-primary" style={{ backgroundColor: '#27ae60', marginBottom: '10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><UserPlus size={18} /> حفظ البيانات</button>
          <button onClick={() => setShowAdd(false)} className="btn-back" style={{ width: '100%' }}>إلغاء</button>
        </div>
      )}

      {/* العودة للقائمة الرئيسية */}
      <button onClick={onBack} className="btn-back" style={{ marginTop: '20px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <ArrowRight size={18} /> العودة للرئيسية
      </button>
    </div>
  );
};

export default Customers;
