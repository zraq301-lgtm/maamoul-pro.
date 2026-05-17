import { CapacitorHttp } from '@capacitor/core';

/**
 * 📤 دالة موحدة لرفع وحفظ البيانات السحابية (محرك المزامنة الخلفية)
 */
export const saveToNawahDB = async (moduleName, recordId, payload) => {
  try {
    const options = {
      url: 'https://nawah-ai-db.vercel.app/api/engine',
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
    console.error(`🚨 خطأ في رفع الموديول ${moduleName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 📥 دالة مستقلة ومنفصلة لجلب واستعادة البيانات السحابية لموديول معين
 */
export const loadFromNawahDB = async (moduleName, recordId) => {
  try {
    const options = {
      url: `https://nawah-ai-db.vercel.app/api/engine?module_name=${moduleName}&record_id=${recordId}`,
      headers: { 'Cache-Control': 'no-cache' }
    };

    const response = await CapacitorHttp.get(options);

    if (response.status === 200 && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    return [];
  } catch (error) {
    console.error(`🚨 خطأ في جلب الموديول ${moduleName}:`, error);
    return [];
  }
};
