import { PrismaClient } from '@prisma/client';

// Singleton instance
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

    // نستخدم المعاملات لضمان سلامة البيانات
    const result = await prisma.$transaction(async (tx) => {
      
      // الضبط الصحيح للـ Tenant مع التأكد من أن الأمر ليس فارغاً
      // ملاحظة: نستخدم template string مباشر للتأكد من إرسال النص لقاعدة البيانات
      await tx.$executeRawUnsafe(`SET nile.tenant_id = '${tenantId}'::uuid`);

      // البحث عن السجل
      const existing = await tx.purchase.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // إنشاء السجل
      return await tx.purchase.create({
        data: {
          tenant_id: tenantId,
          idempotency_key: idempotencyKey,
          total_amount: orderData.total || 0,
          status: "pending",
          items: {
            create: orderData.items || []
          }
        }
      });
    });

    return res.status(200).json({ status: "success", data: result });

  } catch (error) {
    console.error("API Error:", error);

    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    
    return res.status(500).json({ 
      status: "error", 
      message: error.message || "Internal Server Error" 
    });
  }
}
