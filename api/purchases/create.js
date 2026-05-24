// /api/purchases/create.js
import { PurchaseService as ServerService } from '../../services/PurchaseService.js'; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: "Method not allowed" });
  
  try {
    const { tenantId, orderData } = req.body;
    // السيرفر يقوم هنا بمعالجة الطلب وحفظه في قاعدة البيانات
    const result = await ServerService.createPurchaseOrder(tenantId, orderData);
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}
