import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
    throw new Error("الرجاء إضافة MONGODB_URI إلى إعدادات البيئة");
}

if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') return response.status(200).end();
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    try {
        const client = await clientPromise;
        const db = client.db("maamoul_db");
        const { collectionName, data } = request.body;

        if (!collectionName || data === undefined || data === null) {
            return response.status(400).json({ error: 'بيانات ناقصة' });
        }

        // --- التعديل الجوهري لضمان عدم اختفاء البيانات ---
        
        // إذا كانت البيانات مصفوفة
        if (Array.isArray(data)) {
            if (data.length === 0) return response.status(200).json({ success: true, message: 'مصفوفة فارغة' });

            const operations = data.map(item => {
                // نستخدم id المنتج أو نولد واحد جديد فوراً لضمان عدم التداخل
                const uniqueId = item.id || Date.now() + Math.random().toString(36).substr(2, 9);
                const { _id, ...cleanData } = item; 
                
                return {
                    updateOne: {
                        // الفلترة بالـ id لضمان عدم التكرار، والـ upsert للإضافة إذا لم يوجد
                        filter: { id: uniqueId }, 
                        update: { 
                            $set: { 
                                ...cleanData, 
                                id: uniqueId, // نؤكد وجود الـ id
                                updatedAt: new Date() 
                            } 
                        },
                        upsert: true
                    }
                };
            });

            const result = await db.collection(collectionName).bulkWrite(operations);
            return response.status(200).json({ success: true, result });

        } else {
            // إذا كان كائناً واحداً (عملية إنتاج واحدة)
            const uniqueId = data.id || Date.now() + Math.random().toString(36).substr(2, 9);
            const { _id, ...cleanData } = data;
            
            const result = await db.collection(collectionName).updateOne(
                { id: uniqueId },
                { $set: { ...cleanData, id: uniqueId, updatedAt: new Date() } },
                { upsert: true }
            );
            return response.status(200).json({ success: true, result });
        }

    } catch (error) {
        console.error('Database Sync Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
