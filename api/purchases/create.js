import { PurchaseService as ServerService } from '../../src/services/PurchaseService.js'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }
  
  try {
    const { tenantId, orderData, idempotencyKey } = req.body;
    
    // التحقق من وجود المفتاح الفريد لمنع التكرار
    if (!tenantId || !orderData || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required data or idempotency key" });
    }

    // تمرير مفتاح التكرار للخدمة
    const result = await ServerService.createPurchaseOrder(tenantId, orderData, idempotencyKey);
    
    return res.status(200).json({ 
      status: "success", 
      data: result 
    });
    
  } catch (error) {
    // إذا كان الخطأ بسبب تكرار المفتاح، نرسل كود 409 (Conflict)
    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    return res.status(500).json({ status: "error", message: error.message });
  }
}
