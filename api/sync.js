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
        const { collectionName, data } = request.body;

        if (!collectionName || !data) {
            return response.status(400).json({ error: 'بيانات ناقصة' });
        }

        // --- التعديل الجذري هنا ---
        
        if (Array.isArray(data)) {
            const operations = data.map(item => {
                // نأخذ نسخة من البيانات ونحذف منها الـ _id تماماً لمنع الخطأ
                const { _id, ...cleanData } = item; 
                
                return {
                    updateOne: {
                        filter: { id: item.id }, // نعتمد في البحث على id الخاص بك وليس _id
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

            const result = await db.collection(collectionName).bulkWrite(operations);
            return response.status(200).json({ success: true, result });
        } else {
            // نفس الشيء للعنصر الواحد
            const { _id, ...cleanData } = data;
            
            const result = await db.collection(collectionName).updateOne(
                { id: data.id },
                { $set: { ...cleanData, updatedAt: new Date() } },
                { upsert: true }
            );
            return response.status(200).json({ success: true, result });
        }

    } catch (error) {
        console.error('Database Sync Error:', error);
        return response.status(500).json({ error: error.message });
    }
}
