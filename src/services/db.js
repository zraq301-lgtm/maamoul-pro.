/**
 * 📥 دالة مستقلة ومنفصلة لجلب واستعادة البيانات السحابية لموديول معين
 * @param {string} moduleName - اسم القسم (مثل: inventory, sales, purchases)
 * @param {string} recordId - الرقم التعريفي أو اسم السجل (مثل: stock_records)
 * @returns {Promise<Array>} - المصفوفة المسترجعة من السحابة أو مصفوفة فارغة عند عدم الوجود
 */
export const loadFromNawahDB = async (moduleName, recordId) => {
  try {
    const response = await fetch(
      `https://nawah-ai-db.vercel.app/api/engine?module_name=${moduleName}&record_id=${recordId}`,
      {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      }
    );

    if (response.ok) {
      const cloudRecords = await response.json();
      // التأكد من أن النتيجة القادمة هي مصفوفة فعلية لتجنب أي أخطاء بالواجهة
      if (Array.isArray(cloudRecords)) {
        return cloudRecords;
      }
    }
    return []; // إرجاع مصفوفة فارغة إذا كان الملف جديداً أو فارغاً على السيرفر
  } catch (error) {
    console.error(`🚨 الخطأ في دالة جلب الموديول ${moduleName}:`, error);
    throw error; // تمرير الخطأ لكي يمسكه التطبيق الرئيسي ويعرض التنبيه للمستخدم
  }
};
