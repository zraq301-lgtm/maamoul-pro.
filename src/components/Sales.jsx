import React, { useState } from 'react';
// ... استيرادات الأيقونات كما هي ...
import { PurchaseService } from '../services/PurchaseService'; // 1. استيراد الخدمة

const Sales = ({ onBack, onSaveSale, customers = [], stock = [] }) => {
  const [sale, setSale] = useState({ /* ... نفس الحالة السابقة ... */ });
  const [isLoading, setIsLoading] = useState(false); // لإضافة مؤشر تحميل للمستخدم

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sale.customerName || !sale.quantity || !sale.pricePerUnit || !sale.productName) { 
        alert("يرجى إكمال جميع بيانات البيع"); return; 
    }
    
    setIsLoading(true); // بدء التحميل

    try {
        const total = parseFloat(sale.quantity) * parseFloat(sale.pricePerUnit);
        const currentCustomer = customers.find(c => c.name === sale.customerName);
        
        // تجهيز بيانات العملية للـ ERP
        const saleData = {
            tenantId: "مُعرف_المصنع_الحالي", // تأكد من وضع معرف المصنع هنا
            orderData: {
                ...sale,
                total: total,
                customerId: currentCustomer?.id,
                timestamp: new Date().toISOString()
            }
        };

        // 2. إرسال البيانات عبر الخدمة
        await PurchaseService.sendPurchaseData(saleData);

        // إذا نجح السيرفر، نقوم بتحديث الواجهة
        onSaveSale({ ...saleData.orderData, id: Date.now() });
        alert("تم تسجيل العملية بنجاح في النظام");
        onBack();
        
    } catch (error) {
        alert("فشل الاتصال بالسيرفر، تأكد من الإنترنت.");
    } finally {
        setIsLoading(false);
    }
  };

  // ... بقية الـ JSX ...
  // عند زر الحفظ، اجعل الزر معطلاً أثناء التحميل:
  // <button disabled={isLoading} type="submit" ... >{isLoading ? 'جاري الحفظ...' : 'حفظ العملية'}</button>
