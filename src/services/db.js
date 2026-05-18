import { CapacitorHttp } from '@capacitor/core';

// 1. تعريف النطاق وروابط الـ API الخاصة بتطبيق معمول المرفوع على Vercel
const BASE_URL = "https://maamoul-pro-five.vercel.app/api";

export const apiEndpoints = {
  getData: `${BASE_URL}/get-data`,
  deleteItem: `${BASE_URL}/delete-item`,
  raqqaAi: `${BASE_URL}/raqqa-ai`,
  sync: `${BASE_URL}/sync`
};

// 2. محرك الاتصال الخارجي الموحد (CapacitorHttp) لتحريك البيانات داخل التطبيق
const apiService = {

  // جلب البيانات (GET)
  fetchData: async () => {
    try {
      const options = {
        url: apiEndpoints.getData,
        headers: { 'Content-Type': 'application/json' }
      };
      const response = await CapacitorHttp.get(options);
      return response.data;
    } catch (error) {
      console.error("خطأ CapacitorHttp في getData:", error);
      throw error;
    }
  },

  // حذف عنصر (DELETE)
  deleteItem: async (itemId) => {
    try {
      const options = {
        url: apiEndpoints.deleteItem,
        headers: { 'Content-Type': 'application/json' },
        data: { id: itemId }
      };
      const response = await CapacitorHttp.delete(options);
      return response.data;
    } catch (error) {
      console.error("خطأ CapacitorHttp في deleteItem:", error);
      throw error;
    }
  },

  // الاتصال بمحرك ذكاء الرقة الاصطناعي (POST)
  askRaqqaAi: async (promptData) => {
    try {
      const options = {
        url: apiEndpoints.raqqaAi,
        headers: { 'Content-Type': 'application/json' },
        data: { prompt: promptData }
      };
      const response = await CapacitorHttp.post(options);
      return response.data;
    } catch (error) {
      console.error("خطأ CapacitorHttp في raqqaAi:", error);
      throw error;
    }
  },

  // تشغيل عملية المزامنة الذكية (POST)
  triggerSync: async (syncPayload) => {
    try {
      const options = {
        url: apiEndpoints.sync,
        headers: { 'Content-Type': 'application/json' },
        data: syncPayload
      };
      const response = await CapacitorHttp.post(options);
      return response.data;
    } catch (error) {
      console.error("خطأ CapacitorHttp في sync:", error);
      throw error;
    }
  }
};

export default apiService;
