import React from 'react';
import {
  ShoppingCart, Tag, Factory, Warehouse, Trash2,
  Wallet, Truck, BarChart3, FileText, Users,
  TrendingUp, TrendingDown, DollarSign, Package, Settings, UserCheck,
  ClipboardList, Activity, BarChart, Cpu
} from 'lucide-react';

const Dashboard = ({ setActivePage, stats, staffCount }) => {
  // ضبط المعرفات (id) لتطابق ملفات الـ JSX المرفقة بالصورة تماماً
  const sections = [
    { id: 'PurchasesManager', title: 'المشتريات', icon: <ShoppingCart size={28} />, color: '#e67e22' },
    { id: 'Sales', title: 'المبيعات', icon: <Tag size={28} />, color: '#2ecc71' },
    { id: 'ProductionManager', title: 'الإنتاج', icon: <Factory size={28} />, color: '#f59e0b' },
    { id: 'Inventory', title: 'المخزن', icon: <Warehouse size={28} />, color: '#3498db' },
    { id: 'Waste', title: 'الهالك', icon: <Trash2 size={28} />, color: '#e74c3c' },
    { id: 'Expenses', title: 'المصروفات', icon: <Wallet size={28} />, color: '#7f8c8d' },
    { id: 'Suppliers', title: 'الموردين', icon: <Truck size={28} />, color: '#34495e' },
    { id: 'Financials', title: 'قوائم مالية', icon: <BarChart3 size={28} />, color: '#16a085' },
    { id: 'Reports', title: 'التقارير', icon: <FileText size={28} />, color: '#2980b9' },
    { id: 'Customers', title: 'العملاء', icon: <Users size={28} />, color: '#27ae60' },
    { id: 'StaffManagement', title: 'العمالة', icon: <UserCheck size={28} />, color: '#0ea5e9' },
  ];

  const s = stats || {};

  // دالة التعامل مع إصدار تقرير حركة اليوم الفورية لـ nawah.ai
  const handleDailyReport = () => {
    alert('جاري إعداد وتحليل تقرير الحركة اليومية عبر محرك nawah.ai... 📊🤖');
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      
      {/* الهيدر الرئيسي بهوية nawah.ai */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '25px 20px', borderRadius: '24px', color: '#fff', marginBottom: '20px',
        position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Cpu size={20} color="#0ea5e9" />
            <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '800', letterSpacing: '0.5px' }}>nawah.ai</h1>
          </div>
          <p style={{ opacity: 0.7, margin: 0, fontSize: '0.85rem' }}>نظام إدارة الموارد والذكاء الاصطناعي الشامل</p>
        </div>
        <Settings size={120} style={{ position: 'absolute', left: '-20px', bottom: '-20px', opacity: 0.03, color: '#fff' }} />
      </div>

      {/* زر إعداد تقرير مفصل عن حركة اليوم التابع لـ nawah.ai */}
      <button 
        onClick={handleDailyReport}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: '16px',
          background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
          color: '#ffffff',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'transform 0.1s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ClipboardList size={22} />
        تحليل وإصدار التقرير الفوري لنظام nawah.ai
      </button>

      {/* الكروت الإحصائية الأربعة */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'الإيرادات', value: s.totalIncome || 0, icon: <TrendingUp size={18} color="#2ecc71" />, color: '#2ecc71' },
          { label: 'المصروفات', value: s.totalExpenses || 0, icon: <TrendingDown size={18} color="#e74c3c" />, color: '#e74c3c' },
          { label: 'صافي الربح', value: s.netProfit || 0, icon: <DollarSign size={18} color="#f59e0b" />, color: (s.netProfit || 0) >= 0 ? '#2ecc71' : '#e74c3c' },
          { label: 'قيمة المخزن', value: s.stockValue || 0, icon: <Package size={18} color="#3498db" />, color: '#3498db' },
        ].map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
            {item.icon}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: item.color }}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* قسم الرسوم البيانية التخطيطية والتحليل (Mobile-Friendly) */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', borderRadius: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#f59e0b" /> مؤشر حركة الإنتاج الأسبوعي | nawah Engine
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', padding: '0 10px', paddingTop: '10px' }}>
          {[
            { day: 'السبت', rate: '40%' },
            { day: 'الأحد', rate: '65%' },
            { day: 'الاثنين', rate: '85%' },
            { day: 'الثلاثاء', rate: '50%' },
            { day: 'الأربعاء', rate: '95%' },
            { day: 'الخميس', rate: '70%' }
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ 
                width: '12px', 
                height: bar.rate, 
                backgroundColor: '#f59e0b', 
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.5s ease'
              }}></div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', borderRadius: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart size={18} color="#2ecc71" /> تحليل واستقرار السوق المستهدف (nawah.ai Analytics)
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>حجم الطلب واستقرار التوزيع الحالي</div>
            <div style={{ width: '100%', backgroundColor: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '78%', backgroundColor: '#2ecc71', height: '100%' }}></div>
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2ecc71' }}>78%</div>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
          💡 رصد خوارزمي: هناك استقرار ملحوظ في سحب موديول المنتجات المخزنية، ومؤشر الطلب الإقليمي في تصاعد مستمر.
        </p>
      </div>

      {/* مصفوفة الأزرار وتوجيه الموديولات التلقائي */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {sections.map((sec) => (
          <div
            key={sec.id}
            onClick={() => setActivePage(sec.id)}
            className="glass-card"
            style={{
              padding: '18px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'transform 0.2s ease', borderTop: `4px solid ${sec.color}`,
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ color: sec.color, marginBottom: '8px' }}>{sec.icon}</div>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#334155' }}>{sec.title}</span>
          </div>
        ))}
      </div>

      {/* زر إعدادات النظام السفلي التابع لمحرك nawah.ai */}
      <div onClick={() => setActivePage('Settings')} className="glass-card" style={{ marginTop: '20px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>
        <Settings size={20} /> إعدادات nawah.ai والنسخ الاحتياطي للمحرك
      </div>
      
      {/* مساحة أمان سفلية لعدم التداخل مع عناصر التحكم بالهاتف */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
};

export default Dashboard;
