import React, { useState } from 'react';
import Tag from 'lucide-react/dist/esm/icons/tag';
import User from 'lucide-react/dist/esm/icons/user';
import Hash from 'lucide-react/dist/esm/icons/hash';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Save from 'lucide-react/dist/esm/icons/save';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { PurchaseService } from '../services/PurchaseService';

const Sales = ({ onBack, onSaveSale, customers = [], stock = [] }) => {
  const [sale, setSale] = useState({ customerName: '', productName: '', quantity: '', pricePerUnit: '', date: new Date().toISOString().split('T')[0] });
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

        await PurchaseService.createPurchaseOrder(saleData.tenantId, saleData.orderData);
        onSaveSale({ ...saleData.orderData, id: Date.now() });
        alert("تم تسجيل العملية بنجاح");
        onBack();
    } catch (error) {
        alert("فشل الاتصال بالسيرفر");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '15px', direction: 'rtl', fontFamily: "'Tajawal', sans-serif", minHeight: '100vh' }}>
      <div className="page-header"><Tag size={28} color="#2ecc71" /><h2>تسجيل مبيعات</h2></div>
      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ marginBottom: '15px' }}>
          {/* ... بقية الـ JSX الخاص بك ... */}
          <button disabled={isLoading} type="submit" className="btn-primary">
            {isLoading ? 'جاري الحفظ...' : <><Save size={20} /> حفظ العملية</>}
          </button>
          <button type="button" onClick={onBack} className="btn-back"><ArrowRight size={18} /> العودة</button>
        </div>
      </form>
    </div>
  );
};

export default Sales;
