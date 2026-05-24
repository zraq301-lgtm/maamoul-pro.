import React, { useState } from 'react';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Save from 'lucide-react/dist/esm/icons/save';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { PurchaseService } from '../services/PurchaseService';

const Sales = ({ onBack, onSaveSale, customers = [], stock = [] }) => {
  const [sale, setSale] = useState({ 
    customerName: '', 
    productName: '', 
    quantity: '', 
    pricePerUnit: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sale.customerName || !sale.quantity || !sale.pricePerUnit || !sale.productName) { 
        alert("يرجى إكمال جميع بيانات البيع"); return; 
    }
    
    setIsLoading(true);

    try {
        const total = parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit);
        const currentCustomer = customers.find(c => c.name === sale.customerName);
        
        const saleData = {
            tenantId: "DEFAULT_TENANT",
            orderData: {
                ...sale,
                total: total,
                customerId: currentCustomer?.id
            }
        };

        // 1. إرسال البيانات للسيرفر عبر الخدمة الموحدة
        await PurchaseService.createPurchaseOrder(saleData.tenantId, saleData.orderData);
        
        // 2. تحديث الحالة في App.jsx (تحديث محلي)
        onSaveSale({ ...saleData.orderData, id: Date.now() });
        
        alert("تم تسجيل العملية بنجاح");
        onBack();
    } catch (error) {
        console.error("خطأ:", error);
        alert("فشل الاتصال بالسيرفر، تم حفظ العملية محلياً فقط");
        // اختياري: إذا أردت الحفظ محلياً حتى في حال فشل السيرفر:
        onSaveSale({ ...sale, total: parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit), id: Date.now() });
        onBack();
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      <div className="page-header" style={{display:'flex', alignItems:'center', gap:'10px'}}>
        <Tag size={28} color="#2ecc71" /><h2>تسجيل مبيعات</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '20px', marginBottom: '15px' }}>
          {/* حقول الإدخال تبقى كما هي، تأكد فقط من ربطها بـ setSale */}
          <input 
            placeholder="اسم العميل" 
            value={sale.customerName} 
            onChange={(e) => setSale({...sale, customerName: e.target.value})}
            className="input-field" 
          />
          <input 
            placeholder="اسم المنتج" 
            value={sale.productName} 
            onChange={(e) => setSale({...sale, productName: e.target.value})}
            className="input-field" 
          />
          <input 
            type="number"
            placeholder="الكمية" 
            value={sale.quantity} 
            onChange={(e) => setSale({...sale, quantity: e.target.value})}
            className="input-field" 
          />
          <input 
            type="number"
            placeholder="السعر" 
            value={sale.pricePerUnit} 
            onChange={(e) => setSale({...sale, pricePerUnit: e.target.value})}
            className="input-field" 
          />

          <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
            <button disabled={isLoading} type="submit" className="btn-primary" style={{flex: 2}}>
              {isLoading ? 'جاري الحفظ...' : <><Save size={20} /> حفظ العملية</>}
            </button>
            <button type="button" onClick={onBack} className="btn-back" style={{flex: 1}}><ArrowRight size={18} /> العودة</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Sales;
