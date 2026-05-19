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
        
        // 🛠️ تأمين قراءة الـ Body: تحويل النص إلى Object إذا أرسله Capacitor كـ String
        let bodyData = request.body;
        if (typeof bodyData === 'string') {
            try {
                bodyData = JSON.parse(bodyData);
            } catch (jsonError) {
                return response.status(400).json({ 
                    error: 'فشل تفكيك نص البيانات الممرر من الموبايل', 
                    details: jsonError.message 
                });
            }
        }

        // استخراج المتغيرات بعد التأكد من نوعية الـ body
        const { collectionName, module_name, data, jsondata } = bodyData || {};
        
        const targetCollection = module_name || collectionName;
        const targetData = jsondata || data;

        // التحقق الذكي من وجود البيانات الأساسية
        if (!targetCollection || targetData === undefined || targetData === null) {
            return response.status(400).json({ 
                error: 'بيانات ناقصة، يرجى التأكد من إرسال اسم القسم والبيانات بشكل صحيح',
                received: { targetCollection, hasData: !!targetData }
            });
        }

        if (Array.isArray(targetData)) {
            // إذا كانت مصفوفة فارغة
            if (targetData.length === 0) {
                return response.status(200).json({ 
                    success: true, 
                    message: 'لا توجد بيانات للمزامنة (المصفوفة فارغة)',
                    result: { matchedCount: 0, upsertedCount: 0 } 
                });
            }

            const operations = targetData.map(item => {
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

            // الحفظ المجمع
            const result = await db.collection(targetCollection).bulkWrite(operations);
            return response.status(200).json({ success: true, result });

        } else {
            // التعامل مع عنصر واحد (Object)
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
