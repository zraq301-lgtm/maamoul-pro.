import { CapacitorHttp } from '@capacitor/core';

/**
 * 📤 المحرك المطور لإرسال وحفظ البيانات برابطه المستقل المباشر
 */
export const saveToNawahDB = async (moduleName, recordId, payload) => {
  try {
    const options = {
      url: 'https://nawah-ai-db.vercel.app/api/save-engine-data', // 🎯 رابط محرك الرفع المستقل
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        module_name: moduleName,
        record_id: recordId,
        payload: payload
      }
    };

    const response = await CapacitorHttp.post(options);
    if (response.status === 200 && response.data) {
      return { success: true, data: response.data };
    }
    return { success: false, error: response.data };
  } catch (error) {
    console.error(`🚨 خطأ في محرك إرسال الموديول ${moduleName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 📥 المحرك المطور لجلب واستعادة البيانات برابطه المستقل المباشر
 */
export const loadFromNawahDB = async (moduleName, recordId) => {
  try {
    const options = {
      url: 'https://nawah-ai-db.vercel.app/api/get-engine-data', // 🎯 رابط محرك السحب المستقل
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        module_name: moduleName,
        record_id: recordId
      }
    };

    const response = await CapacitorHttp.post(options);
    if (response.status === 200 && response.data) {
      let cloudData = response.data;
      if (cloudData && !Array.isArray(cloudData) && typeof cloudData === 'object') {
        cloudData = cloudData.payload || cloudData.records || cloudData.data || cloudData;
      }
      if (Array.isArray(cloudData)) return cloudData;
    }
    return [];
  } catch (error) {
    console.error(`🚨 خطأ في محرك جلب الموديول ${moduleName}:`, error);
    return [];
  }
};
