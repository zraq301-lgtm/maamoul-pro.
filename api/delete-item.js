import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
  // 1. إعدادات CORS الشاملة والمرنة لمنع تعارض الأجهزة الذكية
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); 
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // معالجة طلب OPTIONS (Preflight request) بشكل فوري لمنع توقف الـ Build والاتصال
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 2. قراءة مرنة لمعطيات الحذف للتغلب على قيود الخوادم وخطأ 405
    // كود App.jsx يرسل ميثود DELETE ويضع المتغيرات في الرابط (request.query)
    let collectionName = request.query?.module_name || request.body?.collectionName;
    let id = request.query?.record_id || request.body?.id;

    // تنظيف اسم المعرّف إذا كان يحتوي على لاحقة المجلّد السحابي لمنع فشل الاستعلام
    if (id && typeof id === 'string' && id.endsWith('_records')) {
      id = id.replace('_records', '');
    }

    // خريطة تصنيف وربط الموديولات الممررة من الواجهة إلى جداول قاعدة البيانات الفعلية
    const moduleToCollectionMap = {
      'stock': 'inventory_module',
      'salesData': 'sales_module',
      'inventory': 'purchases_module',
      'productionData': 'manufacturing_module',
      'expenses': 'dashboard_module',
      'customers': 'customers_module',
      'suppliers': 'suppliers_module',
      'staff': 'staff_module',
      'waste': 'waste_module',
      'cashBook': 'financials_module'
    };

    // التحويل التلقائي لاسم الموديول إلى اسم الـ Collection الأصلي في MongoDB
    if (moduleToCollectionMap[collectionName]) {
      collectionName = moduleToCollectionMap[collectionName];
    }

    // التحقق الآمن من وجود اسم موديول مستهدف قبل المتابعة
    if (!collectionName) {
      return response.status(400).json({ error: 'المعطيات ناقصة: يرجى تحديد اسم الجدول أو الموديول المراد الحذف منه' });
    }

    const client = await clientPromise;
    const db = client.db();

    // 3. بناء مصفوفة الحالات المحتملة للمعرّف (الـ Query الذكي) لتغطية صيغ حفظ البيانات المختلفة
    const orConditions = [
      { id: id },
      { id: isNaN(id) ? id : parseInt(id) }, 
      { _id: id },
      { _id: isNaN(id) ? id : parseInt(id) }
    ];

    // 4. فحص وضبط حالة المعرّفات المعتمدة على نظام الـ ObjectId الخاص بـ MongoDB
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        orConditions.push({ _id: new ObjectId(id) });
        orConditions.push({ id: new ObjectId(id) });
      } catch (e) {
        console.log("فشل تحويل المعرف إلى ObjectId رغم تطابق الصيغة الظاهرية");
      }
    }

    // تجميع شروط الاستعلام للبحث المكثف عن العنصر
    const query = { $or: orConditions };

    // تنفيذ أمر الحذف داخل قاعدة البيانات
    const result = await db.collection(collectionName).deleteOne(query);

    // 5. إرجاع النتيجة وتأكيد الحذف بنجاح للتطبيق متوافقاً مع شرط التحديث الفوري (response.status === 200)
    if (result.deletedCount === 1) {
      return response.status(200).json({
        success: true,
        message: `تم الحذف بنجاح من جدول [${collectionName}]`,
        deletedCount: result.deletedCount
      });
    } else {
      // إرجاع حالة نجاح 200 لتجنب انهيار التزامن التلقائي بالواجهة إذا حذف العنصر مسبقاً
      return response.status(200).json({
        success: false,
        message: "تم تحديث السجل سحابياً (العنصر غير موجود بالسيرفر أو تم حذف المصفوفة مسبقاً)",
        attemptedQuery: query
      });
    }

  } catch (error) {
    console.error('شهدت عملية الحذف خطأ في السيرفر:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
