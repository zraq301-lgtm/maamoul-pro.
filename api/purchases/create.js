import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { tenantId, orderData, idempotencyKey } = req.body;

    if (!tenantId || !orderData || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // التعديل: التأكد من التعامل مع البيانات كنصوص صريحة
    const tId = String(tenantId);
    const iKey = String(idempotencyKey);

    const result = await prisma.$transaction(async (tx) => {
      
      // استخدام tx.purchase بوضوح - Prisma الآن يعرف أنه في public schema
      const existing = await tx.purchase.findFirst({
        where: { 
          idempotency_key: iKey,
          tenant_id: tId 
        }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      return await tx.purchase.create({
        data: {
          tenant_id: tId,
          idempotency_key: iKey,
          total_amount: orderData.total || 0,
          status: "pending",
          items: {
            create: (orderData.items || []).map(item => ({
              product_id: String(item.product_id),
              quantity: parseInt(item.quantity),
              unit_price: parseFloat(item.unit_price)
            }))
          }
        }
      });
    });

    return res.status(200).json({ status: "success", data: result });

  } catch (error) {
    console.error("API Error Details:", error); // تسجيل تفاصيل الخطأ بدقة
    
    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    
    return res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}
