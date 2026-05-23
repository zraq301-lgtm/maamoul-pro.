import { CapacitorHttp } from '@capacitor/core';

/**
 * رابط السيرفر المضيف للـ API
 * يتم فصله في ثابت لتسهيل تغييره مستقبلاً إذا انتقلت لنطاق (Domain) جديد
 */
const API_BASE_URL = 'https://maamoul-pro-five.vercel.app';

export const PurchaseService = {
  
  /**
   * دالة إنشاء طلب شراء (Purchase Order)
   * * @param {string} tenantId - المعرف الفريد للمصنع (لضمان عزل البيانات)
   * @param {Object} orderData - كائن يحتوي على تفاصيل الطلبية (مثل الإجمالي، الأصناف، الحالة)
   * @returns {Promise<Object>} - يعيد بيانات الطلب الذي تم إنشاؤه في قاعدة البيانات
   * @throws {Error} - يرمي خطأ في حال فشل الاتصال أو رفض السيرفر للطلب
   */
  async createPurchaseOrder(tenantId, orderData) {
    // إعدادات الطلب (Options) التي تتوافق مع نظام CapacitorHttp
    const options = {
      url: `${API_BASE_URL}/api/purchases/create`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // البيانات المرسلة يتم تغليفها كما يتوقعها الـ API الخاص بـ Vercel
      data: { 
        tenantId, 
        orderData 
      }
    };

    try {
      // إرسال الطلب عبر الجسر الأصلي للموبايل (Native Bridge) لتجاوز مشاكل الـ CORS
      const response = await CapacitorHttp.request(options);
      
      // نتحقق من نجاح الرد (Status 200) قبل إعادة البيانات
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        // في حالة وجود خطأ من السيرفر (مثل 500 أو 400)
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      // سجل الخطأ في وحدة التحكم لتسهيل عملية التصحيح (Debugging)
      console.error('فشل في إرسال طلب الشراء إلى السيرفر:', error);
      
      // أعد رمي الخطأ ليتم معالجته في الواجهة (UI) وعرض رسالة للمستخدم
      throw error;
    }
  }
};
