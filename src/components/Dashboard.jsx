import React, { useState, useMemo, useEffect } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import Swal from 'sweetalert2';
import {
  ShoppingCart, Tag, Factory, Warehouse, Trash2,
  Wallet, Truck, BarChart3, FileText, Users,
  TrendingUp, TrendingDown, DollarSign, Package, Settings, UserCheck,
  ClipboardList, Activity, BarChart, Cpu, Sparkles, Loader2, Clock, Calendar
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = ({ 
  setActivePage, 
  stats, 
  staffCount, 
  customersData = [], 
  suppliersData = [], 
  staffData = [],
  productionHistory = [], // ممررة لدعم وظائف الإنتاج
  stock = [],             // ممررة لدعم وظائف المخزن
  fetchData,              // دالة جلب وتحديث البيانات الرئيسية من App
  onDeleteItem           // دالة الحذف السحابي والمحلي الموحدة
}) => {
  // حالة التحميل الخاصة بالذكاء الاصطناعي
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ==========================================
  // [تحديث مضاف ومصلح]: جلب وتحديث البيانات تلقائياً عند تحميل اللوحة
  // ==========================================
  useEffect(() => {
    if (typeof fetchData === 'function') {
      fetchData(); // تحديث فوري ومزامنة المؤشرات والبيانات السحابية والمحلية
    }
  }, []); // تعمل فور فتح الـ Dashboard مباشرة

  const sections = [
    { id: 'PurchasesManager', title: 'المشتريات', icon: <ShoppingCart size={28}/>, color: '#e67e22' },
    { id: 'Sales', title: 'المبيعات', icon: <Tag size={28}/>, color: '#2ecc71' },
    { id: 'ProductionManager', title: 'الإنتاج', icon: <Factory size={28}/>, color: '#f59e0b' },
    { id: 'Inventory', title: 'المخزن', icon: <Warehouse size={28}/>, color: '#3498db' },
    { id: 'Waste', title: 'الهالك', icon: <Trash2 size={28}/>, color: '#e74c3c' },
    { id: 'Expenses', title: 'المصروفات', icon: <Wallet size={28}/>, color: '#7f8c8d' },
    { id: 'Suppliers', title: 'الموردين', icon: <Truck size={28}/>, color: '#34495e' },
    { id: 'Financials', title: 'قوائم مالية', icon: <BarChart3 size={28}/>, color: '#16a085' },
    { id: 'Reports', title: 'التقارير', icon: <FileText size={28}/>, color: '#2980b9' },
    { id: 'Customers', title: 'العملاء', icon: <Users size={28}/>, color: '#27ae60' },
    { id: 'StaffManagement', title: 'العمالة', icon: <UserCheck size={28}/>, color: '#0ea5e9' },
  ];

  const s = stats || {};

  // ==========================================
  // 1. وظيفة معالجة بيانات الرسم البياني
  // ==========================================
  const chartData = useMemo(() => {
    if (!productionHistory || !Array.isArray(productionHistory)) return [];
    return productionHistory.map(item => ({
      name: item.date ? item.date.split('-').slice(1).join('/') : '', 
      كمية: parseFloat(item.products?.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) || 0),
      تكلفة: parseFloat(item.totalActualCost || 0)
    })).slice(-7); 
  }, [productionHistory]);

  // ==========================================
  // 2. وظيفة التقرير الفوري للوضع الحالي للمصنع
  // ==========================================
  const generateTodayReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayProd = productionHistory.filter(p => p.date === today);
    const totalCost = todayProd.reduce((sum, p) => sum + parseFloat(p.totalActualCost || 0), 0);
    const lowStockCount = stock.filter(i => parseFloat(i.balance || i.quantity || 0) < 5).length;

    Swal.fire({
      title: '📊 تقرير حالة المصنع',
      html: `<div style="text-align: right; font-family: 'Tajawal', sans-serif; line-height: 1.8;">
          <p>📅 إنتاج اليوم: <b>${todayProd.length} وردية</b></p>
          <p>💰 إجمالي تكلفة اليوم: <b style="color: #e67e22">${totalCost.toFixed(2)} ج.م</b></p>
          <p>📦 أصناف المخزن: <b>${stock.length} صنف</b></p>
          <p>⚠️ أصناف أوشكت على النفاذ: <b style="color: #ef4444">${lowStockCount}</b></p>
        </div>`,
      icon: 'info', confirmButtonText: 'ممتاز'
    });
  };

  // ==========================================
  // 3. وظيفة الذكاء الصناعي الاستشارية (AI Analysis)
  // ==========================================
  const analyzeWithAI = async () => {
    if (!productionHistory.length && !stock.length) {
        Swal.fire('تنبيه', 'لا توجد بيانات كافية للتحليل حالياً', 'warning');
        return;
    }
    setIsAiLoading(true);
    try {
      const analysisContext = {
        recentProduction: productionHistory.slice(-5).map(p => ({ date: p.date, cost: p.totalActualCost })),
        inventoryStatus: stock.map(s => ({ item: s.name, balance: s.balance })),
        lowStockItems: stock.filter(s => s.balance < 5).map(s => s.name)
      };
      const response = await CapacitorHttp.post({
        url: 'https://maamoul-one.vercel.app/api/raqqa-ai',
        headers: { 'Content-Type': 'application/json' },
        data: { prompt: `نصيحة مختصرة لمصنع زاد الخير بناء على: ${JSON.stringify(analysisContext)}` }
      });
      Swal.fire({ title: '🤖 تحليل الذكاء الصناعي', text: response.data?.message || "مستقر", icon: 'success' });
    } catch (error) {
      Swal.fire('عذراً', 'الذكاء الصناعي مشغول بالخلفية حالياً، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ==========================================
  // 4. دالة حذف الإنتاج المتصلة بالجدول السفلي المضاف ومزامنة البيانات للـ App
  // ==========================================
  const handleDeleteProduction = async (id) => {
    if (!id) return;
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: "هل تريد حذف سجل الإنتاج هذا نهائياً؟ سينعكس هذا على إحصائياتك مباشرة.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });

    if (result.isConfirmed) {
      try {
        if (typeof onDeleteItem === 'function') {
           await onDeleteItem(id, 'production');
           if (typeof fetchData === 'function') await fetchData(); // إعادة جلب وتأكيد صحة المزامنة لـ App
        } else {
           const response = await CapacitorHttp.post({
             url: `https://maamoul-one.vercel.app/api/production`, 
             headers: { 'Content-Type': 'application/json' },
             data: { collectionName: 'production', id: id }
           });
           if (response.data && response.data.success) {
             Swal.fire('تم الحذف', 'تم مسح السجل بنجاح ومزامنة لوحة القيادة', 'success');
             if (typeof fetchData === 'function') await fetchData();
           }
        }
      } catch (error) {
        Swal.fire('خطأ', 'فشل الوصول للـ API الخاص بالنظام', 'error');
      }
    }
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      
      {/* الهيدر العلوي ونظام nawah.ai */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '25px 20px', borderRadius: '24px', color: '#fff', marginBottom: '20px',
        position: 'relative', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Cpu size={20} color="#0ea5e9"/>
            <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '800', letterSpacing: '0.5px' }}>nawah.ai</h1>
          </div>
          <p style={{ opacity: 0.7, margin: 0, fontSize: '0.85rem' }}>نظام إدارة الموارد والذكاء الاصطناعي الشامل</p>
        </div>
        <Settings size={120} style={{ position: 'absolute', left: '-20px', bottom: 0, opacity: 0.03, color: '#fff' }}/>
      </div>

      {/* أزرار التحكم العلوي للذكاء الاصطناعي والتقارير الفورية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={analyzeWithAI} 
          disabled={isAiLoading} 
          style={{
            padding: '15px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff',
            border: 'none', fontWeight: 'bold', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Cpu size={18} />} ذكاء صناعي AI
        </button>

        <button 
          onClick={generateTodayReport} 
          style={{
            padding: '15px', borderRadius: '16px',
            background: '#1e293b', color: '#fff',
            border: 'none', fontWeight: 'bold', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
          }}
        >
          <BarChart3 size={18} /> إصدار التقرير
        </button>
      </div>

      {/* كروت كتل الإحصائيات الأربعة الرئيسية المحدثة لحظياً */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'الإيرادات', value: s.totalIncome || 0, icon: <TrendingUp size={18} color="#2ecc71"/>, color: '#2ecc71' },
          { label: 'المصروفات', value: s.totalExpenses || 0, icon: <TrendingDown size={18} color="#e74c3c"/>, color: '#e74c3c' },
          { label: 'صافي الربح', value: s.netProfit || 0, icon: <DollarSign size={18} color="#f59e0b"/>, color: (s.netProfit || 0) >= 0 ? '#2ecc71' : '#e74c3c' },
          { label: 'قيمة المخزن', value: s.stockValue || 0, icon: <Package size={18} color="#3498db"/>, color: '#3498db' },
        ].map((item, i) => (
          <div key={i} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '14px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            {item.icon}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: item.color }}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* حاوية الرسم البياني - منحنى الإنتاج الفعلي */}
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: 'bold' }}>
          <TrendingUp size={18} color="#e67e22" /> منحنى الإنتاج الفعلي
        </h3>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" style={{fontSize: '10px'}} />
              <Tooltip />
              <Area type="monotone" dataKey="كمية" stroke="#e67e22" fillOpacity={0.1} fill="#e67e22" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* أزرار الموديولات والأقسام الرئيسية للتنقل داخل التطبيق */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {sections.map((sec) => (
          <div
            key={sec.id}
            onClick={() => setActivePage(sec.id)}
            style={{
              backgroundColor: '#fff', borderRadius: '20px',
              padding: '18px 10px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'transform 0.2s ease', borderTop: `4px solid ${sec.color}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ color: sec.color, marginBottom: '8px' }}>{sec.icon}</div>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#334155' }}>{sec.title}</span>
          </div>
        ))}
      </div>

      {/* سجل الإنتاج الكامل وإمكانية إدارة الحذف الحية */}
      <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: 'bold' }}>
          <Calendar size={18} color="#3498db" /> سجل الإنتاج الكامل
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '600px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '10px 5px' }}>التاريخ</th>
                <th style={{ padding: '10px 5px' }}>المنتج</th>
                <th style={{ padding: '10px 5px' }}>الكمية</th>
                <th style={{ padding: '10px 5px' }}>سعر الكرتونة</th>
                <th style={{ padding: '10px 5px' }}>الإجمالي</th>
                <th style={{ padding: '10px 5px' }}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {productionHistory && productionHistory.length > 0 ? (
                [...productionHistory].reverse().map((log, idx) => {
                  const logId = log._id || log.id;
                  const totalQty = log.products?.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) || 0;
                  const totalCost = parseFloat(log.totalActualCost || 0);
                  const unitPrice = totalQty > 0 ? (totalCost / totalQty).toFixed(2) : 0;
                  
                  return (
                    <tr key={logId || idx} style={{ fontSize: '12px', borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 5px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>{log.date}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}><Clock size={10} /> {log.shift || 'وردية'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 5px' }}>{log.products?.[0]?.name || 'منتج'}</td>
                      <td style={{ padding: '10px 5px' }}>{totalQty} كرتونة</td>
                      <td style={{ padding: '10px 5px', color: '#10b981' }}>{unitPrice} ج.م</td>
                      <td style={{ padding: '10px 5px', fontWeight: 'bold', color: '#e67e22' }}>{totalCost.toFixed(2)} ج.م</td>
                      <td style={{ padding: '10px 5px' }}>
                        <button onClick={() => handleDeleteProduction(logId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>لا توجد بيانات إنتاج حالياً</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* زر الإعدادات السفلي ومزامنة التخزين */}
      <div onClick={() => setActivePage('Settings')} style={{ backgroundColor: '#fff', borderRadius: '16px', marginTop: '20px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Settings size={20}/> إعدادات nawah.ai والنسخ الاحتياطي للمحرك
      </div>
      
      <div style={{ height: '100px' }}></div>
    </div>
  );
};

export default Dashboard;
