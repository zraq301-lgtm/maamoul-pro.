import { CapacitorHttp } from '@capacitor/core';

const API_BASE_URL = 'https://maamoul-pro-five.vercel.app';

export const PurchaseService = {
  // دالة المشتريات التي تستخدم CapacitorHttp للاتصال بالـ API
  async createPurchaseOrder(tenantId, orderData) {
    const options = {
      url: `${API_BASE_URL}/api/purchases/create`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { tenantId, orderData }
    };

    try {
      const response = await CapacitorHttp.request(options);
      return response.data; // النتيجة قادمة من Vercel
    } catch (error) {
      console.error('خطأ في الاتصال بالـ API:', error);
      throw error;
    }
  }
};
