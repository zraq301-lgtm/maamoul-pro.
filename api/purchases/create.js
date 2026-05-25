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

    // لا حاجة لـ SET nile.tenant_id
    // سنقوم بالفلترة يدوياً في كل استعلام لضمان أمان البيانات
    
    const result = await prisma.$transaction(async (tx) => {
      // البحث مع فلترة يدوية للـ tenant_id
      const existing = await tx.purchase.findFirst({
        where: { 
          idempotency_key: idempotencyKey,
          tenant_id: tenantId // الفلترة اليدوية هنا هي الأمان الحقيقي
        }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // الإنشاء
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
    return res.status(500).json({ status: "error", message: error.message });
  }
}
