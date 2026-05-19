import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
    // إعدادات الوصول CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();

    // التحقق من أن الطلب GET فقط
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'مسموح فقط بطلبات GET هنا' });
    }

    try {
        const client = await clientPromise;
        const db = client.db("maamoul_db");

        // استخراج المتغيرات القادمة من تطبيق Maamoul
        // ندعم collectionName أو module_name كاسم للمجموعة لضمان التوافق التام
        const { collectionName, module_name } = request.query;
        const targetCollection = module_name || collectionName;

        if (!targetCollection) {
            return response.status(400).json({ 
                error: 'يجب تحديد اسم القسم المراد جلبه',
                hint: 'تأكد من إرسال parameter باسم module_name أو collectionName' 
            });
        }

        // جلب البيانات من المجموعة المطلوبة
        const data = await db.collection(targetCollection).find({}).toArray();

        // إرجاع البيانات بالشكل المتوافق مع محرك الجلب في الـ App
        return response.status(200).json(data);

    } catch (error) {
        console.error('Fetch Error:', error);
        return response.status(500).json({ error: 'خطأ داخلي في السيرفر', details: error.message });
    }
}
