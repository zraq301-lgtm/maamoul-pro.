import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
  // 1. إعدادات CORS الشاملة (تم إضافة DELETE لضمان استقبال طلبات الفرونت إند الموحدة)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS'); 
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // معالجة طلب OPTIONS (Preflight request)
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. التحقق من الـ Method (نقبل POST و DELETE لضمان التوافق المطلق مع كود الفرونت إند وكاباسيتور)
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return response.status(405).json({ 
      error: `الرجاء استخدام POST أو DELETE لإتمام عملية الحذف. الميثود المستخدمة حالياً: ${request.method}` 
    });
  }

  try {
    // استخراج البيانات سواء كانت قادمة في الـ Body (طلب POST) أو في الـ Query (طلب DELETE) لربط كود App.jsx
    let collectionName = request.body?.collectionName || request.query?.module_name;
    let id = request.body?.id || request.query?.record_id;

    // تنظيف اسم الجدول (إذا كان ينتهي بـ _records كما هو مرسل من دالة deleteCloudData)
    if (id && id.endsWith('_records')) {
      // إذا كان الحذف يتم للموديول بالكامل سحابياً أو لعنصر ممرر
      id = id.replace('_records', '');
    }

    // خريطة تحويل أسماء الموديولات القادمة من الفرونت إند إلى أسماء الجداول الحقيقية في قاعدة البيانات
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

    // إذا كان الاسم القادم هو المفتاح البرمجي (مثل stock) نقوم بتحويله لاسم الجدول الحقيقي (inventory_module)
    if (moduleToCollectionMap[collectionName]) {
      collectionName = moduleToCollectionMap[collectionName];
    }

    if (!collectionName) {
      return response.status(400).json({ error: 'المعطيات ناقصة: يرجى تحديد اسم الجدول أو الموديول المراد الحذف منه' });
    }

    const client = await clientPromise;
    const db = client.db(); // يتصل تلقائياً بقاعدة البيانات المحددة في الـ URI

    // 3. بناء مصفوفة الحالات المحتملة للمعرّف (الـ Query الذكي)
    // نبدأ بالبحث في الحقول العادية سواء كان الحقل اسمه "id" أو "_id" وسواء كان رقماً أو نصاً
    const orConditions = [
      { id: id },
      { id: isNaN(id) ? id : parseInt(id) }, // لو كان الـ id رقم مخزن كـ Number
      { _id: id },
      { _id: isNaN(id) ? id : parseInt(id) }
    ];

    // 4. حالة الحذف عبر الـ ObjectId الخاص بمونجو (مهمة جداً)
    // نتحقق أولاً إذا كان الـ id المرسل يتوافق مع صيغة الـ ObjectId المكونة من 24 حرفاً
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        orConditions.push({ _id: new ObjectId(id) });
        orConditions.push({ id: new ObjectId(id) });
      } catch (e) {
        console.log("فشل تحويل المعرف إلى ObjectId رغم تطابق الصيغة الظاهرية");
      }
    }

    // تجميع الحالات في استعلام واحد $or
    const query = { $or: orConditions };

    // تنفيذ عملية الحذف داخل الجدول الديناميكي المربوط
    const result = await db.collection(collectionName).deleteOne(query);

    // 5. الرد بناءً على النتيجة لتتوافق مع شروط نجاح الاستجابة في الفرونت إند status === 200
    if (result.deletedCount === 1) {
      return response.status(200).json({
        success: true,
        message: `تم الحذف بنجاح من جدول [${collectionName}]`,
        deletedCount: result.deletedCount
      });
    } else {
      // إرجاع حالة 200 نجاح حتى لو كان الحذف محلياً بالكامل مسبقاً لمنع ظهور أخطاء شبكة في الفرونت إند
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
