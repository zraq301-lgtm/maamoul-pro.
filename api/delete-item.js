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
  // إعدادات CORS للسماح بالوصول من التطبيق
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();

  // قبول POST و DELETE لزيادة التوافق
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("maamoul_db");

    // استخراج البيانات بدقة عالية من كل المصادر الممكنة
    const body = request.body || {};
    const query = request.query || {};
    
    // محاولة جلب اسم المجموعة (الافتراضي production)
    const collectionName = body.collectionName || query.collectionName || "production";
    
    // محاولة جلب المعرف (ID) من الجسم أو الرابط أو الاستعلام
    let id = body.id || query.id || body._id || query._id;
    
    // إذا لم يوجد ID، نحاول استخراجه من نهاية الرابط (URL)
    if (!id) {
        const parts = request.url.split('/');
        id = parts[parts.length - 1].split('?')[0];
    }

    if (!id || id === 'production') {
       return response.status(400).json({ success: false, message: "ID is required" });
    }

    // بناء شروط البحث (بما في ذلك تحويلات الأنواع)
    let queryConditions = [
      { _id: id },
      { id: id },
      { id: isNaN(id) ? id : parseFloat(id) }
    ];

    // إضافة الـ ObjectId إذا كان صالحاً (مهم جداً لـ MongoDB)
    if (ObjectId.isValid(id)) {
      queryConditions.push({ _id: new ObjectId(id) });
    }

    const result = await db.collection(collectionName).deleteOne({
      $or: queryConditions
    });

    if (result.deletedCount >= 1) {
      return response.status(200).json({ success: true, message: "تم الحذف بنجاح" });
    } else {
      // محاولة أخيرة بالاسم إذا كان الـ ID المرسل هو اسم المنتج بالخطأ
      const name = body.name || query.name || id;
      const finalTry = await db.collection(collectionName).deleteOne({
        $or: [{ name: name }, { item: name }]
      });

      if (finalTry.deletedCount >= 1) {
        return response.status(200).json({ success: true, message: "تم الحذف بواسطة الاسم" });
      }

      return response.status(404).json({ success: false, message: "العنصر غير موجود" });
    }
  } catch (error) {
    console.error("API Error:", error);
    return response.status(500).json({ error: error.message });
  }
}
