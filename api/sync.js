import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("maamoul_db"); // اسم قاعدة بيانات مشروعك
    const { collectionName, data } = req.body; // نستقبل اسم القسم والبيانات

    if (!collectionName || !data) {
      return res.status(400).json({ message: 'Missing data or collection name' });
    }

    // "المعادلة الذكية": تحديث البيانات إذا كانت موجودة أو إضافة بيانات جديدة (Upsert)
    // نستخدم "document_id" كمفتاح للمطابقة بين الأندرويد والسحابة
    const result = await db.collection(collectionName).updateOne(
      { id: data.id }, 
      { $set: { ...data, last_sync: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({ 
      success: true, 
      message: "تمت المزامنة بنجاح مع MongoDB",
      result 
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "خطأ في الاتصال بقاعدة البيانات" });
  }
}
