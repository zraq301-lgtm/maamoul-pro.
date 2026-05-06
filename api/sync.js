import clientPromise from "../lib/mongodb";

export default async function handler(request, response) {
    // 1. إعدادات الوصول CORS (للسماح للأندرويد والمتصفح بالاتصال)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // التعامل مع طلبات Preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // 2. التحقق من طريقة الطلب (نحتاج POST للمزامنة)
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 3. الاتصال بقاعدة البيانات
        const client = await clientPromise;
        const db = client.db("maamoul_db"); // تأكد من اسم قاعدة بياناتك
        
        const { collectionName, data } = request.body;

        if (!collectionName || !data) {
            return response.status(400).json({ error: 'Missing collectionName or data' });
        }

        // 4. تنفيذ عملية التحديث أو الإضافة (Upsert)
        const result = await db.collection(collectionName).updateOne(
            { id: data.id }, 
            { 
                $set: { 
                    ...data, 
                    updatedAt: new Date(),
                    sync_source: 'vercel_api'
                } 
            },
            { upsert: true }
        );

        // 5. إرسال استجابة النجاح
        return response.status(200).json({ 
            success: true, 
            message: 'Synced successfully with MongoDB',
            result 
        });

    } catch (error) {
        // طباعة الخطأ في Vercel Logs للتشخيص
        console.error('Database Sync Error:', error);
        return response.status(500).json({ 
            error: 'Internal Server Error', 
            details: error.message 
        });
    }
}
