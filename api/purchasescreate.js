// api/purchases/create.js
import { PurchaseService } from '../../services/PurchaseService';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { tenantId, orderData } = req.body;
    const result = await PurchaseService.createPurchaseOrder(tenantId, orderData);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
