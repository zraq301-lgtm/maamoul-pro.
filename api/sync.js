import clientPromise from "../lib/mongodb.js";

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    try {
        const client = await clientPromise;
        const db = client.db("maamoul_db");
        
        // دعم التسميتين لضمان عدم حدوث أي تعارض بين الفرونت والسيرفر
        const { collectionName, module_name, data, jsondata } = request.body;
        
        const targetCollection = module_name || collectionName;
        const targetData = jsondata || data;

        // التحقق الذكي من وجود البيانات الأساسية لمنع كراش 500
        if (!targetCollection || targetData === undefined || targetData === null) {
            return response.status(400).json({ error: 'بيانات ناقصة، يرجى التأكد من إرسال اسم القسم والبيانات بشكل صحيح' });
        }

        if (Array.isArray(targetData)) {
            // إذا كانت المصفوفة فارغة، ننهي الطلب بنجاح دون إرسال شيء لقاعدة البيانات
            if (targetData.length === 0) {
                return response.status(200).json({ 
                    success: true, 
                    message: 'لا توجد بيانات للمزامنة (المصفوفة فارغة)',
                    result: { matchedCount: 0, upsertedCount: 0 } 
                });
            }

            const operations = targetData.map(item => {
                // التأكد من تنظيف الـ _id الخاص بمونجو دي بي القديم إن وجد لمنع أخطاء Immutable Field
                const { _id, ...cleanData } = item; 
                
                return {
                    updateOne: {
                        filter: { id: item.id }, 
                        update: { 
                            $set: { 
                                ...cleanData, 
                                updatedAt: new Date() 
                            } 
                        },
                        upsert: true
                    }
                };
            });

            // تنفيذ الحفظ الشامل والمجمع في خطوة واحدة سريعة واحترافية
            const result = await db.collection(targetCollection).bulkWrite(operations);
            return response.status(200).json({ success: true, result });

        } else {
            // التعامل الآمن مع عنصر واحد منفرد (Object)
            const { _id, ...cleanData } = targetData;
            
            const result = await db.collection(targetCollection).updateOne(
                { id: targetData.id },
                { $set: { ...cleanData, updatedAt: new Date() } },
                { upsert: true }
            );
            return response.status(200).json({ success: true, result });
        }

    } catch (error) {
        console.error('Database Sync Error:', error);
        return response.status(500).json({ error: 'حدث خطأ داخلي أثناء حفظ البيانات', details: error.message });
    }
}
