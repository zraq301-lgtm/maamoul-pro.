import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, Tag, Factory, Warehouse, 
  BarChart3, TrendingUp, Calendar, BrainCircuit, Loader2, Clock, Trash2
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CapacitorHttp } from '@capacitor/core';
import Swal from 'sweetalert2';

import LogoImage from '../services/icon-foreground.png';

const Dashboard = ({ setActivePage, productionHistory = [], stock = [], stats = {}, fetchData, onDeleteItem }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. معالجة بيانات الرسم البياني
  const chartData = useMemo(() => {
    if (!productionHistory || !Array.isArray(productionHistory)) return [];
    return productionHistory.map(item => ({
      name: item.date ? item.date.split('-').slice(1).join('/') : '', 
      كمية: parseFloat(item.products?.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) || 0),
      تكلفة: parseFloat(item.totalActualCost || 0)
    })).slice(-7); 
  }, [productionHistory]);

  // دالة الحذف الذكية
  const handleDeleteProduction = async (id) => {
    if (!id) return;

    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: "هل تريد حذف سجل الإنتاج هذا نهائياً؟",
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
        } else {
           const response = await CapacitorHttp.post({
             url: `https://maamoul-one.vercel.app/api/production`, 
             headers: { 'Content-Type': 'application/json' },
             data: { collectionName: 'production', id: id }
           });

           if (response.data && response.data.success) {
             Swal.fire('تم الحذف', 'تم مسح السجل بنجاح', 'success');
             if (fetchData) await fetchData();
           } else {
             throw new Error("فشل الحذف من السيرفر");
           }
        }
      } catch (error) {
        Swal.fire('خطأ', 'فشل الوصول للـ API', 'error');
      }
    }
  };

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

  // --- تفعيل زرار الذكاء الصناعي ---
  const analyzeWithAI = async () => {
    if (!productionHistory.length && !stock.length) {
        Swal.fire('تنبيه', 'لا توجد بيانات كافية للتحليل حالياً', 'warning');
        return;
    }
    
    setIsAiLoading(true);
    try {
      // تجهيز ملخص البيانات للذكاء الصناعي ليفهم حالة المصنع
      const analysisContext = {
        recentProduction: productionHistory.slice(-5).map(p => ({ date: p.date, cost: p.totalActualCost })),
        inventoryStatus: stock.map(s => ({ item: s.name, balance: s.balance })),
        lowStockItems: stock.filter(s => s.balance < 5).map(s => s.name)
      };

      const response = await CapacitorHttp.post({
        url: 'https://maamoul-one.vercel.app/api/raqqa-ai',
        headers: { 'Content-Type': 'application/json' },
        data: { 
            prompt: `أنت مساعد ذكي لمصنع "زاد الخير". بناءً على هذه البيانات: ${JSON.stringify(analysisContext)}، قدم نصيحة واحدة سريعة ومختصرة جداً عن الإنتاج أو المخزن.` 
        }
      });

      // عرض النتيجة بشكل جمالي
      Swal.fire({ 
        title: '🤖 تحليل زاد الخير الذكي', 
        text: response.data?.message || response.data?.reply || "المصنع يعمل بشكل مستقر حالياً، استمر على هذا الأداء!",
        icon: 'success',
        confirmButtonText: 'فهمت'
      });
    } catch (error) {
      console.error("AI Error:", error);
      Swal.fire('عذراً', 'الذكاء الصناعي مشغول حالياً، حاول مرة أخرى لاحقاً', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const sections = [
    { id: 'production', title: 'تشغيل الإنتاج', icon: <Factory size={28} />, color: '#e67e22', desc: 'إضافة وردية جديدة' },
    { id: 'inventory', title: 'إدارة المخزن', icon: <Warehouse size={28} />, color: '#3498db', desc: 'خامات ومنتجات' },
  ];

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tajawal, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LogoImage} alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '10px' }} />
          <div>
            <h1 style={{ fontSize: '1.3rem', color: '#1e293b', margin: 0, fontWeight: '900' }}>زاد <span style={{ color: '#e67e22' }}>الخير</span></h1>
            <p style={{ color: '#64748b', fontSize: '10px', margin: 0 }}>للصناعات الغذائية</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={analyzeWithAI} disabled={isAiLoading} style={aiButtonStyle}>
            {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />} AI
          </button>
          <button onClick={generateTodayReport} style={reportButtonStyle}>
            <BarChart3 size={14} /> التقرير
          </button>
        </div>
      </header>

      <div style={cardStyle}>
        <h3 style={cardTitleStyle}><TrendingUp size={18} color="#e67e22" /> منحنى الإنتاج الأخير</h3>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e67e22" stopOpacity={0.2}/><stop offset="95%" stopColor="#e67e22" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
              <Tooltip />
              <Area type="monotone" dataKey="كمية" stroke="#e67e22" strokeWidth={3} fill="url(#colorQty)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
        {sections.map((sec) => (
          <div key={sec.id} onClick={() => setActivePage(sec.id)} style={{ ...menuItemStyle, borderRight: `6px solid ${sec.color}` }}>
            <div style={{ color: sec.color, marginBottom: '10px' }}>{sec.icon}</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>{sec.title}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sec.id === 'inventory' ? `${stock.length} صنف مسجل` : sec.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h3 style={cardTitleStyle}><Calendar size={18} color="#3498db" /> تفاصيل آخر عمليات الإنتاج</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '400px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '10px 5px' }}>التاريخ</th>
                <th style={{ padding: '10px 5px' }}>المنتج</th>
                <th style={{ padding: '10px 5px' }}>الكمية</th>
                <th style={{ padding: '10px 5px' }}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {productionHistory.slice(-5).reverse().map((log, idx) => {
                const logId = log._id || log.id;
                return (
                  <tr key={logId || idx} style={{ fontSize: '12px', borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 5px', color: '#64748b' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{log.date}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}><Clock size={10} /> {log.shift || 'الوردية'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 5px', fontWeight: 'bold' }}>{log.products?.[0]?.name || 'معمول جاهز'}</td>
                    <td style={{ padding: '10px 5px' }}>{log.products?.[0]?.quantity || 0} كرتونة</td>
                    <td style={{ padding: '10px 5px' }}>
                      <button 
                        onClick={() => handleDeleteProduction(logId)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// الأنماط الثابتة
const cardStyle = { backgroundColor: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' };
const cardTitleStyle = { fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', fontWeight: 'bold' };
const menuItemStyle = { backgroundColor: '#fff', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer' };
const aiButtonStyle = { background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '12px' };
const reportButtonStyle = { background: '#1e293b', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '12px' };

export default Dashboard;
