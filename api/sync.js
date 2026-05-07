import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
    // 1. إعدادات CORS الشاملة
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        const client = await clientPromise;
        const db = client.db("maamoul_db");

        // --- الحالة الأولى: جلب البيانات (GET) ---
        if (request.method === 'GET') {
            const { collectionName } = request.query; // نأخذ اسم القسم من الرابط

            if (!collectionName) {
                return response.status(400).json({ error: 'يرجى تحديد اسم القسم collectionName' });
            }

            const data = await db.collection(collectionName).find({}).toArray();
            return response.status(200).json({ success: true, data });
        }

        // --- الحالة الثانية: حفظ البيانات (POST) ---
        if (request.method === 'POST') {
            const { collectionName, data } = request.body;

            if (!collectionName || !data) {
                return response.status(400).json({ error: 'بيانات ناقصة' });
            }

            // إذا كانت البيانات مصفوفة (Array) نقوم بحفظها كعناصر منفصلة
            if (Array.isArray(data)) {
                // نستخدم BulkWrite أو تحديث كل عنصر بمعرفه الخاص
                const operations = data.map(item => ({
                    updateOne: {
                        filter: { id: item.id },
                        update: { $set: { ...item, updatedAt: new Date() } },
                        upsert: true
                    }
                }));
                const result = await db.collection(collectionName).bulkWrite(operations);
                return response.status(200).json({ success: true, message: 'تم حفظ المصفوفة بنجاح', result });
            } else {
                // حفظ عنصر واحد فقط
                const result = await db.collection(collectionName).updateOne(
                    { id: data.id },
                    { $set: { ...data, updatedAt: new Date() } },
                    { upsert: true }
                );
                return response.status(200).json({ success: true, result });
            }
        }

        // إذا تم استخدام Method غير GET أو POST
        return response.status(405).json({ error: 'Method Not Allowed' });

    } catch (error) {
        console.error('Database Error:', error);
        return response.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
