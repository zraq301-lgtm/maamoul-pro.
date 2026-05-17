/**
 * دالة إرسال وحفظ البيانات في محرك قاعدة بيانات nawah.ai
 * @param {string} moduleName - اسم الموديول المستهدف (مثال: 'sales', 'inventory', 'ProductionManager')
 * @param {string} recordId - المعرف الفريد للملف (مثال: 'inv_1002' أو رقم السيريال)
 * @param {Object} payload - البيانات الفعلية المراد تخزينها بصيغة Object
 */
export const saveToNawahDB = async (moduleName, recordId, payload) => {
  const API_URL = 'https://nawah-ai-db.vercel.app/api/engine';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module_name: moduleName,
        record_id: recordId,
        payload: payload
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ تم الحفظ بنجاح في جيت هب:', result.message);
      return { success: true, message: result.message };
    } else {
      console.error('❌ فشل الحفظ في المحرك:', result.error || result.details);
      return { success: false, error: result.error || 'حدث خطأ أثناء الرفع' };
    }

  } catch (error) {
    console.error('🚨 خطأ في الاتصال بالسيرفر:', error.message);
    return { success: false, error: error.message };
  }
};
