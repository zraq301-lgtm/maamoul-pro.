import React from 'react';
import { BarChart3, ArrowRight, TrendingUp, TrendingDown, DollarSign, PieChart, Package, Wallet, FileSpreadsheet, PlusCircle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem'; // استيراد نظام ملفات الموبايل

const Financials = ({ onBack, stats = {}, cashBook = [] }) => {
  const s = stats;
  const netProfit = s.netProfit || 0;

  // --- وظيفة التصدير المعدلة لتعمل على الأندرويد ---
  const handleExportExcel = async () => {
    try {
      // 1. تجهيز البيانات
      const summaryData = [
        { "البند": "إجمالي الإيرادات", "القيمة": s.totalIncome || 0 },
        { "البند": "إجمالي المصروفات", "القيمة": s.totalExpenses || 0 },
        { "البند": "صافي الأرباح", "القيمة": netProfit },
        { "البند": "قيمة المخزن", "القيمة": s.stockValue || 0 },
        { "البند": "رصيد الخزينة", "القيمة": s.cashBalance || 0 }
      ];

      const cashBookData = cashBook.map(entry => ({
        "التاريخ": entry.timestamp,
        "البيان": entry.description || entry.category,
        "النوع": entry.type === 'in' ? 'وارد' : 'صادر',
        "المبلغ": entry.amount
      }));

      // 2. إنشاء ملف الإكسل (بصيغة Base64 للموبايل)
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsCashBook = XLSX.utils.json_to_sheet(cashBookData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "الملخص");
      XLSX.utils.book_append_sheet(wb, wsCashBook, "السجل");

      // تحويل الكتاب إلى Buffer (Base64)
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

      // 3. حفظ الملف في ذاكرة الهاتف (Android)
      const fileName = `Financial_Report_${Date.now()}.xlsx`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: wbout,
        directory: Directory.Documents, // سيتم حفظه في مجلد Documents
        recursive: true
      });

      alert(`تم حفظ ملف الإكسل بنجاح في مجلد المستندات باسم: ${fileName}`);
      
    } catch (error) {
      console.error("خطأ في حفظ الملف:", error);
      alert("تعذر حفظ الملف. تأكد من إعطاء صلاحية الوصول للملفات.");
    }
  };

  const handleAddStatement = () => {
    const name = prompt("أدخل اسم القائمة الجديدة:");
    if (name) alert(`تم إضافة قائمة: ${name}`);
  };

  const handleDeleteStatement = () => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف آخر قائمة؟");
    if (confirmDelete) alert("تم الحذف بنجاح");
  };

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '15px' }}>
        <button onClick={handleExportExcel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px', border: 'none', borderRadius: '12px', backgroundColor: '#1d6f42', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
          <FileSpreadsheet size={20} /> تصدير Excel
        </button>
        <button onClick={handleAddStatement} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px', border: 'none', borderRadius: '12px', backgroundColor: '#3498db', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
          <PlusCircle size={20} /> إضافة قائمة
        </button>
        <button onClick={handleDeleteStatement} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px', border: 'none', borderRadius: '12px', backgroundColor: '#e74c3c', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>
          <Trash2 size={20} /> حذف قائمة
        </button>
      </div>

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
