import React from 'react';
import { BarChart3, ArrowRight, TrendingUp, TrendingDown, DollarSign, PieChart, Package, Wallet } from 'lucide-react';

const Financials = ({ onBack, stats = {}, cashBook = [] }) => {
  const s = stats;
  const netProfit = s.netProfit || 0;
  const statItems = [
    { label: 'إجمالي الإيرادات', value: s.totalIncome || 0, icon: <TrendingUp size={18} color="#2ecc71" />, color: '#2ecc71', bg: 'rgba(236, 253, 245, 0.8)' },
    { label: 'إجمالي المصروفات', value: s.totalExpenses || 0, icon: <TrendingDown size={18} color="#e74c3c" />, color: '#e74c3c', bg: 'rgba(254, 226, 226, 0.8)' },
    { label: 'قيمة الهالك', value: s.totalWasteValue || 0, icon: <PieChart size={18} color="#f59e0b" />, color: '#f59e0b', bg: 'rgba(254, 243, 199, 0.8)' },
    { label: 'مشتريات كاش', value: s.totalPurchasesCash || 0, icon: <Wallet size={18} color="#7f8c8d" />, color: '#7f8c8d', bg: 'rgba(241, 245, 249, 0.8)' },
    { label: 'قيمة المخزن', value: s.stockValue || 0, icon: <Package size={18} color="#3498db" />, color: '#3498db', bg: 'rgba(239, 246, 255, 0.8)' },
    { label: 'رصيد الخزينة', value: s.cashBalance || 0, icon: <DollarSign size={18} color="#16a085" />, color: '#16a085', bg: 'rgba(240, 253, 244, 0.8)' },
  ];

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      <div className="page-header"><BarChart3 size={28} color="#16a085" /><h2>القوائم المالية</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        {statItems.map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: '14px', background: item.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>{item.icon}<span style={{ fontSize: '0.8rem', color: '#475569' }}>{item.label}</span></div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: item.color }}>{item.value.toLocaleString()} <small style={{ fontSize: '0.7rem' }}>ج.م</small></div>
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ padding: '25px', textAlign: 'center', background: netProfit >= 0 ? 'rgba(220, 252, 231, 0.8)' : 'rgba(254, 226, 226, 0.8)', marginBottom: '15px' }}>
        <div style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '8px' }}>صافي الأرباح</div>
        <div style={{ fontSize: '2rem', fontWeight: '900', color: netProfit >= 0 ? '#166534' : '#991b1b' }}>{netProfit.toLocaleString()} <small style={{ fontSize: '1rem' }}>ج.م</small></div>
      </div>
      {cashBook.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '15px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem', marginBottom: '12px', color: '#334155' }}>آخر حركات الخزينة</h3>
          {cashBook.slice(-10).reverse().map((entry, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 9 ? '1px solid rgba(226, 232, 240, 0.5)' : 'none' }}>
              <div><div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>{entry.description || entry.category}</div><div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{entry.timestamp}</div></div>
              <div style={{ fontWeight: '800', color: entry.type === 'in' ? '#2ecc71' : '#e74c3c', fontSize: '0.95rem' }}>{entry.type === 'in' ? '+' : '-'}{parseFloat(entry.amount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={onBack} className="btn-back"><ArrowRight size={18} /> العودة للوحة التحكم</button>
    </div>
  );
};

export default Financials;
