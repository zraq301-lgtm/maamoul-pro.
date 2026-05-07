import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
    // إعدادات CORS للسماح بالاتصال من تطبيق الأندرويد
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // السماح فقط بطريقة DELETE
    if (request.method !== 'DELETE') {
        return response.status(405).json({ error: 'Method Not Allowed. Use DELETE.' });
    }

    try {
        const { collectionName, id } = request.query;

        if (!collectionName || !id) {
            return response.status(400).json({ error: 'Missing collectionName or id' });
        }

        const client = await clientPromise;
        const db = client.db("maamoul_db");

        // محاولة الحذف
        // ملاحظة: نحول الـ id لرقم إذا كان مخزناً كرقم، أو نتركه نصاً إذا كان نصاً
        const result = await db.collection(collectionName).deleteOne({ 
            id: isNaN(id) ? id : parseInt(id) 
        });

        if (result.deletedCount === 1) {
            return response.status(200).json({ 
                success: true, 
                message: `تم الحذف بنجاح من ${collectionName}` 
            });
        } else {
            return response.status(404).json({ 
                success: false, 
                message: "العنصر غير موجود في قاعدة البيانات" 
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
