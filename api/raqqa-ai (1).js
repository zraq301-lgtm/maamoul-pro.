// File: api/raqqa-ai.js

export default async function handler(req, res) {
    // 1. إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // 2. معالجة الخطأ: التأكد من وجود البيانات في req.body
    // في بعض بيئات Serverless، قد تحتاج للتأكد من فك تشفير JSON
    let body = req.body;
    
    // إذا كان الـ body عبارة عن نص (String)، قم بتحويله إلى كائن (Object)
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ message: "Invalid JSON format" });
        }
    }

    // التحقق من وجود prompt لمنع الانهيار (TypeError)
    const prompt = body?.prompt;

    if (!prompt) {
        return res.status(400).json({ message: "برجاء إرسال نص السؤال (prompt) في جسم الطلب." });
    }

    const groqKey = process.env.GROQ_API_KEY; 
    const mxbKey = process.env.MXBAI_API_KEY;
    const storeId = "66de0209-e17d-4e42-81d1-3851d5a0d826";

    // --- [منطق توليد الصور] ---
    const imageKeywords = ["ارسم", "تخيل", "صورة لـ", "صورة ل"];
    if (imageKeywords.some(keyword => prompt.startsWith(keyword))) {
        const imageDescription = prompt.replace(/ارسم|تخيل|صورة لـ|صورة ل/g, "").trim();
        const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageDescription)}?width=1024&height=1024&nologo=true`;
        return res.status(200).json({ 
            message: `تفضلي يا رفيقتي، هذه هي الصورة التي تخيلتها لكِ: \n\n ![image](${generatedImageUrl})` 
        });
    }

    try {
        const imageRegex = /https?:\/\/\S+\.(jpg|jpeg|png|webp|gif)/i;
        const foundImageUrl = prompt.match(imageRegex);

        let libraryContext = "";
        try {
            const mxbRes = await fetch(`https://api.mixedbread.ai/v1/stores/${storeId}/query`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${mxbKey}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ query: prompt, top_k: 3 })
            });

            if (mxbRes.ok) {
                const mxbData = await mxbRes.json();
                libraryContext = mxbData?.hits?.map(h => h.content).join("\n\n") || "";
            }
        } catch (err) {
            console.error("Mixedbread Error: ", err.message);
        }

        let groqModel = "llama-3.3-70b-versatile"; 
        let messages = [];

        const productionAnalystSystemPrompt = `
        أنتِ "رقة"، المحللة الذكية لعمليات إنتاج مصنع المعمول. 
        مهمتك: تحليل الإنتاج، رصد الهبوط لـ 3 أيام متتالية، وتقديم تقارير ذكية.
        المعلومات من السجلات: ${libraryContext}
        `;

        if (foundImageUrl) {
            groqModel = "llama-3.2-11b-vision-preview";
            messages = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: foundImageUrl[0] } }
                    ]
                }
            ];
        } else {
            messages = [
                { role: "system", content: productionAnalystSystemPrompt },
                { role: "user", content: prompt }
            ];
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: groqModel,
                messages: messages,
                temperature: 0.5 
            })
        });

        const data = await groqRes.json();
        
        if (data.choices && data.choices[0]) {
            res.status(200).json({ message: data.choices[0].message.content });
        } else {
            throw new Error(data.error?.message || "Error from Groq");
        }

    } catch (error) {
        console.error("Final API Error:", error);
        res.status(200).json({ message: "عذراً، رقة تواجه ضغطاً حالياً. حاولي مرة أخرى." });
    }
}
