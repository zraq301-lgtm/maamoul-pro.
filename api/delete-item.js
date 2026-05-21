import { ObjectId } from "mongodb";
import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
  // 1. إعدادات CORS الشاملة
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // معالجة طلب OPTIONS (Preflight request)
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. التحقق من الـ Method (نعتمد POST لضمان توافق البيئات مثل Capacitor)
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      error: `الرجاء استخدام POST لإتمام عملية الحذف. الميثود المستخدمة حالياً: ${request.method}` 
    });
  }

  try {
    const { collectionName, id } = request.body;

    if (!collectionName || !id) {
      return response.status(400).json({ error: 'المعطيات ناقصة: يرجى إرسال collectionName و id' });
    }

    const client = await clientPromise;
    const db = client.db(); // يتصل تلقائياً بقاعدة البيانات المحددة في المونجو المكتوبة في الـ URI

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

    // تنفيذ عملية الحذف
    const result = await db.collection(collectionName).deleteOne(query);

    // 5. الرد بناءً على النتيجة
    if (result.deletedCount === 1) {
      return response.status(200).json({
        success: true,
        message: `تم الحذف بنجاح من جدول [${collectionName}]`,
        deletedCount: result.deletedCount
      });
    } else {
      return response.status(404).json({
        success: false,
        message: "لم يتم العثور على العنصر؛ قد يكون المعرّف غير صحيح أو تم حذفه مسبقاً",
        attemptedQuery: query // نرسل الـ query للفرونت إند للمساعدة في التحقق أثناء التطوير
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
