import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
let clientPromise;

if (!uri) throw new Error("MONGODB_URI is missing");

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default async function handler(request, response) {
  // إعدادات CORS للسماح بالوصول الكامل من التطبيق وأجهزة المحمول
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') return response.status(200).end();

  // السماح بطلب الـ GET فقط لإظهار رسالة فحص آمنة بدلاً من انهيار الصفحة بـ Method not allowed
  if (request.method === 'GET') {
    return response.status(200).json({ 
      success: true, 
      message: "سيرفر الحذف يعمل بنجاح ومستعد لاستقبال الطلبات من التطبيق." 
    });
  }

  // قبول POST و DELETE لمعالجة عمليات الحذف الفعلية
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("maamoul_db");

    const body = request.body || {};
    const query = request.query || {};
    
    // 🔥 الربط الذكي: جلب اسم الموديول الممرر من الفرونت إند بجميع صيغه المحتملة
    let collectionName = query.module_name || body.module_name || query.collectionName || body.collectionName;
    
    // 🔥 الربط الذكي: جلب معرّف العنصر (ID) الممرر كـ record_id أو id
    let id = query.record_id || body.record_id || query.id || body.id || query._id || body._id;
    
    // خريطة تصنيف وربط الموديولات القادمة من التطبيق إلى جداول قاعدة البيانات الفعلية لديك
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

    // التحويل التلقائي لاسم الموديول إذا كان قادماً بالاسم المختصر
    if (collectionName && moduleToCollectionMap[collectionName]) {
      collectionName = moduleToCollectionMap[collectionName];
    }

    // إذا لم يتوفر اسم الموديول، نضع القيمة الافتراضية للإنتاج لحماية الكود من الانهيار
    if (!collectionName) {
      collectionName = "production";
    }
    
    // إذا لم يوجد ID، نحاول استخراجه من نهاية الرابط (URL) كخطوة احتياطية
    if (!id) {
        const parts = request.url.split('/');
        id = parts[parts.length - 1].split('?')[0];
    }

    if (!id || id === 'production' || id === '[object Object]') {
       return response.status(400).json({ success: false, message: "معرف العنصر (ID) مطلوب لإتمام عملية الحذف" });
    }

    // تنظيف اسم المعرّف إذا كان يحتوي على لاحقة المجلّد السحابي لمنع فشل الاستعلام ميكانيكياً
    if (typeof id === 'string' && id.endsWith('_records')) {
      id = id.replace('_records', '');
    }

    // بناء شروط البحث المكثفة داخل قاعدة البيانات (بما في ذلك تحويلات الأنواع الرقمية والنصية)
    let queryConditions = [
      { id: id },
      { id: isNaN(id) ? id : parseFloat(id) },
      { id: isNaN(id) ? id : parseInt(id) },
      { _id: id },
      { _id: isNaN(id) ? id : parseFloat(id) },
      { _id: isNaN(id) ? id : parseInt(id) }
    ];

    // إضافة الـ ObjectId إذا كان صالحاً وبصيغة المونجو الأصلية الـ 24 حرفاً
    if (typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        if (ObjectId.isValid(id)) {
          queryConditions.push({ _id: new ObjectId(id) });
          queryConditions.push({ id: new ObjectId(id) });
        }
      } catch (e) {
        console.log("تخطي تحويل ObjectId");
      }
    }

    // تنفيذ أمر الحذف الفعلي داخل جدول البيانات المستهدف ديناميكياً
    const result = await db.collection(collectionName).deleteOne({
      $or: queryConditions
    });

    if (result.deletedCount >= 1) {
      return response.status(200).json({ 
        success: true, 
        message: `تم الحذف بنجاح من جدول [${collectionName}]`,
        deletedCount: result.deletedCount 
      });
    } else {
      // محاولة أخيرة بالاسم أو العنصر إذا كان الممرر بالخطأ هو الاسم الحرفي للمنتج
      const name = body.name || query.name || id;
      const finalTry = await db.collection(collectionName).deleteOne({
        $or: [{ name: name }, { item: name }, { itemName: name }]
      });

      if (finalTry.deletedCount >= 1) {
        return response.status(200).json({ 
          success: true, 
          message: `تم الحذف بنجاح بواسطة تطابق الاسم من جدول [${collectionName}]` 
        });
      }

      // إرجاع حالة 200 لمنع تجمد التطبيق بالفرونت إند وإعلامه بتحديث الحالة محلياً
      return response.status(200).json({ 
        success: false, 
        message: `تم التحديث بنجاح (العنصر تم حذفه مسبقاً أو غير موجود في خادم ${collectionName})` 
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    return response.status(500).json({ error: "خطأ في الخادم الداخلي", details: error.message });
  }
}
