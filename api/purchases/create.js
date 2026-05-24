// /api/purchases/create.js

// المسار الصحيح: نخرج من مجلد api/purchases ثم ندخل إلى مجلد src/services
import { PurchaseService as ServerService } from '../../src/services/PurchaseService.js'; 

export default async function handler(req, res) {
  // التأكد من أن الطلب من نوع POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }
  
  try {
    const { tenantId, orderData } = req.body;
    
    // التحقق من وجود البيانات الأساسية
    if (!tenantId || !orderData) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // استدعاء الخدمة لمعالجة الطلب وحفظه في قاعدة البيانات
    const result = await ServerService.createPurchaseOrder(tenantId, orderData);
    
    return res.status(200).json({ 
      status: "success", 
      data: result 
    });
    
  } catch (error) {
    // إرجاع الخطأ مع توضيح الرسالة
    return res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}
