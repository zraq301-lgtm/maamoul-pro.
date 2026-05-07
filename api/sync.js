import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
    // 1. إعدادات CORS الشاملة
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // التعامل مع طلبات Preflight
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // السماح بطلبات POST فقط للحفظ
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed. Use POST for syncing.' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("maamoul_db");

        const { collectionName, data } = request.body;

        // التحقق من وصول البيانات المطلوبة
        if (!collectionName || !data) {
            return response.status(400).json({ error: 'بيانات ناقصة: collectionName أو data غير موجودة' });
        }

        let result;

        // الحالة الأولى: إذا كانت البيانات مصفوفة (Array)
        if (Array.isArray(data)) {
            if (data.length === 0) {
                return response.status(200).json({ success: true, message: 'المصفوفة فارغة، لا يوجد ما يتم حفظه' });
            }

            const operations = data.map(item => ({
                updateOne: {
                    filter: { id: item.id },
                    update: { $set: { ...item, updatedAt: new Date() } },
                    upsert: true
                }
            }));

            result = await db.collection(collectionName).bulkWrite(operations);
            return response.status(200).json({ 
                success: true, 
                message: 'تم حفظ المصفوفة بنجاح عبر bulkWrite', 
                result 
            });
        } 
        
        // الحالة الثانية: حفظ عنصر واحد فقط (Object)
        else {
            result = await db.collection(collectionName).updateOne(
                { id: data.id },
                { $set: { ...data, updatedAt: new Date() } },
                { upsert: true }
            );
            return response.status(200).json({ 
                success: true, 
                message: 'تم حفظ العنصر بنجاح', 
                result 
            });
        }

    } catch (error) {
        console.error('Database Sync Error:', error);
        return response.status(500).json({ 
            error: 'Internal Server Error', 
            details: error.message 
        });
    }
}
