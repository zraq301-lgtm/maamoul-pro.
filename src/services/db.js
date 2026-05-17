import { CapacitorHttp } from '@capacitor/core';

/**
 * 📥 محرك جلب واستعادة البيانات السحابية (مطابق تماماً لحماية السيرفر الجديدة)
 */
export const loadFromNawahDB = async (moduleName, recordId) => {
  try {
    const options = {
      url: 'https://nawah-ai-db.vercel.app/api/get-engine-data', 
      method: 'POST', // 🎯 يجب أن تكون POST حصراً ليقبلها السيرفر الجديد
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: { // إرسال المتغيرات داخل الـ Body بأمان كامل
        module_name: moduleName,
        record_id: recordId
      }
    };

    const response = await CapacitorHttp.post(options);

    if (response.status === 200 && response.data) {
      let cloudData = response.data;

      // تفكيك البيانات الذكي في حال كانت مغلفة
      if (cloudData && !Array.isArray(cloudData) && typeof cloudData === 'object') {
        cloudData = cloudData.payload || cloudData.records || cloudData.data || cloudData;
      }

      if (Array.isArray(cloudData)) {
        return cloudData; // إرجاع المصفوفة النظيفة لصبها بالواجهة
      }
    }
    return [];
  } catch (error) {
    console.error(`🚨 خطأ اتصال بمحرك الجلب:`, error);
    return [];
  }
};

/**
 * 📤 محرك إرسال وحفظ البيانات السحابية التلقائي
 */
export const saveToNawahDB = async (moduleName, recordId, payload) => {
  try {
    const options = {
      url: 'https://nawah-ai-db.vercel.app/api/engine', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        module_name: moduleName,
        record_id: recordId,
        payload: payload
      }
    };

    const response = await CapacitorHttp.post(options);
    if (response.status === 200 || response.status === 201) {
      return { success: true, data: response.data };
    }
    return { success: false, error: response.data };
  } catch (error) {
    console.error(`🚨 خطأ في محرك الإرسال:`, error);
    return { success: false, error: error.message };
  }
};
