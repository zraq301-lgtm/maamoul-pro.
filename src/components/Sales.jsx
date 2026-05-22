import React, { useState } from 'react';
// استيراد الأيقونات بشكل مباشر لمنع توقف الـ Actions وتوفير استهلاك الذاكرة
import Tag from 'lucide-react/dist/esm/icons/tag';
import User from 'lucide-react/dist/esm/icons/user';
import Hash from 'lucide-react/dist/esm/icons/hash';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Save from 'lucide-react/dist/esm/icons/save';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

const Sales = ({ onBack, onSaveSale, customers = [], stock = [] }) => {
  const [sale, setSale] = useState({ customerName: '', productName: '', quantity: '', pricePerUnit: '', date: new Date().toISOString().split('T')[0] });
  
  // تصفية المنتجات لتكون ذات رصيد متاح وجاهزة للبيع بناءً على شروط كود المخزن السابق للإنتاج والمنتج النهائي
  const availableProducts = stock.filter(s => {
    const hasBalance = s.balance > 0;
    
    const name = (s.name || '').toString().toLowerCase();
    const department = (s.department || s.source || '').toString();
    const category = (s.category || '').toString();
    
    const isFromProduction = department.includes('إنتاج') || department.includes('production') || name.includes('إنتاج') || category === 'منتجات';
    const isFinishedName = name.includes('نهائي') || name.includes('جاهز') || name.includes('معمول');
    
    // يجب أن يكون له رصيد، وينطبق عليه شرط "جاهز للبيع" الأصلي أو شروط المخزن للمنتج النهائي
    return hasBalance && (s.type === 'جاهز للبيع' || isFromProduction || isFinishedName);
  });
  
  const selectedProduct = stock.find(s => s.name === sale.productName);
  const availableQty = selectedProduct ? selectedProduct.balance : 0;
  
  // حساب اسم الوحدة بشكل آمن يمنع خطأ الـ Build في الأندرويد
  const productUnit = selectedProduct && selectedProduct.unit ? selectedProduct.unit : 'وحدة';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sale.customerName || !sale.quantity || !sale.pricePerUnit || !sale.productName) { alert("يرجى إكمال جميع بيانات البيع"); return; }
    if (parseFloat(sale.quantity) > availableQty) { alert(`الكمية المطلوبة (${sale.quantity}) تتجاوز الرصيد المتوفر (${availableQty})`); return; }
    onSaveSale({ ...sale, total: parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit), id: Date.now() });
    alert("تم تسجيل عملية البيع بنجاح"); onBack();
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      <div className="page-header"><Tag size={28} color="#2ecc71" /><h2>تسجيل مبيعات</h2></div>
      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ marginBottom: '15px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label className="form-label"><User size={16} color="#2ecc71" /> اسم العميل / المحل</label>
            <select 
              className="glass-input" 
              value={sale.customerName} 
              onChange={(e) => setSale({ ...sale, customerName: e.target.value })}
            >
              <option value="">اختر عميلاً من القائمة...</option>
              {customers.map((c, i) => (
                <option key={i} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label className="form-label"><ClipboardList size={16} color="#2ecc71" /> الصنف</label>
            <select className="glass-input" value={sale.productName} onChange={(e) => setSale({ ...sale, productName: e.target.value })}>
              <option value="">اختر صنف من المخزن...</option>
              {availableProducts.map(s => <option key={s.id} value={s.name}>{s.name} (متوفر: {s.balance})</option>)}
            </select>
          </div>
          {sale.productName && (
            <div style={{ background: availableQty > 0 ? 'rgba(236, 253, 245, 0.8)' : 'rgba(254, 226, 226, 0.8)', padding: '10px 14px', borderRadius: '12px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: availableQty > 0 ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
              <AlertCircle size={16} /> الرصيد المتوفر: {availableQty} {productUnit}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label className="form-label"><Hash size={16} color="#2ecc71" /> الكمية</label><input type="number" className="glass-input" placeholder="عدد الكراتين" value={sale.quantity} onChange={(e) => setSale({ ...sale, quantity: e.target.value })} /></div>
            <div><label className="form-label"><DollarSign size={16} color="#2ecc71" /> السعر</label><input type="number" className="glass-input" placeholder="سعر الكرتونة" value={sale.pricePerUnit} onChange={(e) => setSale({ ...sale, pricePerUnit: e.target.value })} /></div>
          </div>
          {sale.quantity && sale.pricePerUnit && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(236, 253, 245, 0.8)', borderRadius: '12px', textAlign: 'center', color: '#065f46', fontWeight: 'bold' }}>
              إجمالي البيع: {(parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit)).toLocaleString()} جنيه
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button type="submit" className="btn-primary" style={{ backgroundColor: '#2ecc71', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)' }}><Save size={20} /> حفظ العملية</button>
          <button type="button" onClick={onBack} className="btn-back"><ArrowRight size={18} /> العودة للرئيسية</button>
        </div>
      </form>
    </div>
  );
};

export default Sales;
