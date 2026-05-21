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

  // طباعة نوع الطلب في الـ Terminal للمساعدة في التتبع
  console.log(`الميثود المستلمة هي: ${request.method}`);

  // 2. التحقق من الـ Method
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      error: `الرجاء استخدام POST لإتمام عملية الحذف. الميثود الحالية المستخدمة هي: ${request.method}` 
    });
  }

  try {
    // 3. استلام البيانات من Body
    const { collectionName, id } = request.body;

    if (!collectionName || !id) {
      return response.status(400).json({ error: 'Missing collectionName or id' });
    }

    const client = await clientPromise;
    
    // تصحيح: استدعاء قاعدة البيانات الافتراضية المحددة في الرابط بدون تمرير الـ URI كاملاً
    const db = client.db(); 

    // 4. محاولة الحذف الذكي (نصوص أو أرقام)
    const query = {
      $or: [
        { id: id },
        { id: isNaN(id) ? id : parseInt(id) },
        { _id: id } 
      ]
    };

    const result = await db.collection(collectionName).deleteOne(query);

    if (result.deletedCount === 1) {
      return response.status(200).json({
        success: true,
        message: `تم الحذف بنجاح من ${collectionName}`
      });
    } else {
      return response.status(404).json({
        success: false,
        message: "العنصر غير موجود أو تم حذفه مسبقاً"
      });
    }

  } catch (error) {
    console.error('Delete Error:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
