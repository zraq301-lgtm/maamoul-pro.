import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  // التحقق من أن الطلب POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'الطريقة غير مسموح بها' });
  }

  try {
    const client = await clientPromise;
    // استخراج اسم قاعدة البيانات من الرابط أو استخدام اسم افتراضي
    const db = client.db("maamoul_db"); 
    
    const { collectionName, data } = req.body;

    if (!collectionName || !data) {
      return res.status(400).json({ message: 'بيانات القسم أو المحتوى ناقصة' });
    }

    // "المعادلة الذكية": تحديث البيانات إذا كانت موجودة (Upsert)
    // نستخدم id المنتج أو المادة الخام كمفتاح للمطابقة
    const result = await db.collection(collectionName).updateOne(
      { id: data.id }, 
      { 
        $set: { 
          ...data, 
          last_sync: new Date(),
          source: 'mobile_app' 
        } 
      },
      { upsert: true }
    );

    return res.status(200).json({ 
      success: true, 
      message: "تمت المزامنة بنجاح مع MongoDB",
      updatedId: data.id 
    });

  } catch (e) {
    console.error("MongoDB Sync Error:", e);
    return res.status(500).json({ 
      message: "فشل الاتصال بـ MongoDB", 
      error: e.message 
    });
  }
}
