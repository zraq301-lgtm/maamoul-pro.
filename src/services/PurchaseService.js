import { CapacitorHttp } from '@capacitor/core';

/**
 * رابط السيرفر المضيف للـ API
 */
const API_BASE_URL = 'https://maamoul-pro-five.vercel.app';

export const PurchaseService = {
  
  /**
   * دالة إنشاء طلب شراء (Purchase Order)
   * @param {string} tenantId - المعرف الفريد للمصنع
   * @param {Object} orderData - تفاصيل الطلبية
   * @param {string} idempotencyKey - مفتاح فريد لمنع تكرار الطلب (مثلاً UUID)
   * @returns {Promise<Object>} 
   */
  async createPurchaseOrder(tenantId, orderData, idempotencyKey) {
    const options = {
      url: `${API_BASE_URL}/api/purchases/create`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { 
        tenantId, 
        orderData,
        idempotencyKey // إرسال المفتاح للسيرفر
      }
    };

    try {
      const response = await CapacitorHttp.request(options);
      
      // التعامل مع حالة النجاح
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } 
      
      // التعامل مع حالة التكرار (409 Conflict)
      if (response.status === 409) {
        throw new Error('DUPLICATE_ORDER');
      }

      // حالات الخطأ الأخرى
      throw new Error(`Server responded with status ${response.status}`);
      
    } catch (error) {
      console.error('فشل في إرسال طلب الشراء:', error);
      
      // نقوم بإعادة رمي الخطأ ليتم التعامل معه في الواجهة
      throw error;
    }
  }
};
