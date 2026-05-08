import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
  // 1. إعدادات CORS الشاملة
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // السماح بـ POST للحذف لضمان التوافق
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // معالجة طلب OPTIONS (Preflight request)
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. السماح بـ POST لأن CapacitorHttp يرسل البيانات في الـ Body بشكل أفضل عبر POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'الرجاء استخدام POST لإتمام عملية الحذف' });
  }

  try {
    // 3. استلام البيانات من Body (أكثر أماناً واحترافية)
    const { collectionName, id } = request.body;

    if (!collectionName || !id) {
      return response.status(400).json({ error: 'Missing collectionName or id' });
    }

    const client = await clientPromise;
    const db = client.db("maamoul_db");

    // 4. محاولة الحذف الذكي (نصوص أو أرقام)
    const query = {
      $or: [
        { id: id },
        { id: isNaN(id) ? id : parseInt(id) },
        { _id: id } // دعم إضافي في حال كان الحذف عبر الـ _id الخاص بمونجو
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
