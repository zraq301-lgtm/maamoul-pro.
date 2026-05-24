import React, { useState } from 'react';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Save from 'lucide-react/dist/esm/icons/save';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { PurchaseService } from '../services/PurchaseService';
import Swal from 'sweetalert2';

const Sales = ({ onBack, onUpdate, data }) => {
  // استخراج البيانات من الكائن الموحد data
  const { salesData = [], customers = [] } = data;
  
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
        Swal.fire('تنبيه', 'يرجى إكمال جميع بيانات البيع', 'warning');
        return; 
    }
    
    setIsLoading(true);

    try {
        const total = parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit);
        const currentCustomer = customers.find(c => c.name === sale.customerName);
        
        const newSaleEntry = {
            ...sale,
            total: total,
            customerId: currentCustomer?.id,
            id: Date.now()
        };

        // 1. إرسال للسيرفر عبر خدمة المشتريات/المبيعات الموحدة
        await PurchaseService.createPurchaseOrder("DEFAULT_TENANT", newSaleEntry);
        
        // 2. تحديث الحالة المركزية باستخدام الدالة الموحدة onUpdate
        await onUpdate('salesData', [...salesData, newSaleEntry]);
        
        Swal.fire('نجاح', 'تم تسجيل عملية البيع بنجاح', 'success');
        onBack();
    } catch (error) {
        console.error("خطأ:", error);
        Swal.fire('خطأ', 'فشل الاتصال بالسيرفر، تعذر الحفظ', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
      <div className="page-header" style={{display:'flex', alignItems:'center', gap:'10px', marginBottom: '20px'}}>
        <Tag size={28} color="#2ecc71" /><h2>تسجيل مبيعات جديد</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#fff' }}>
          <input placeholder="اسم العميل" value={sale.customerName} onChange={(e) => setSale({...sale, customerName: e.target.value})} className="input-field" />
          <input placeholder="اسم المنتج" value={sale.productName} onChange={(e) => setSale({...sale, productName: e.target.value})} className="input-field" />
          <input type="number" placeholder="الكمية" value={sale.quantity} onChange={(e) => setSale({...sale, quantity: e.target.value})} className="input-field" />
          <input type="number" placeholder="السعر للوحدة" value={sale.pricePerUnit} onChange={(e) => setSale({...sale, pricePerUnit: e.target.value})} className="input-field" />

          <div style={{marginTop: '25px', display: 'flex', gap: '10px'}}>
            <button disabled={isLoading} type="submit" className="btn-primary" style={{flex: 2, zIndex: 10, position: 'relative'}}>
              {isLoading ? 'جاري المعالجة...' : <><Save size={20} /> حفظ العملية</>}
            </button>
            <button type="button" onClick={onBack} className="btn-back" style={{flex: 1}}><ArrowRight size={18} /> العودة</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Sales;
