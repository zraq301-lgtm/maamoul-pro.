import { PrismaClient } from '@prisma/client';

// تهيئة PrismaClient لاستخدام المتغير البيئي NILEDB_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NILEDB_URL,
    },
  },
});

export default async function handler(req, res) {
  // 1. السماح فقط بطريقة POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { tenantId, orderData, idempotencyKey } = req.body;

    // 2. التحقق من البيانات المطلوبة
    if (!tenantId || !orderData || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // 3. تنفيذ العملية باستخدام Transaction لضمان السلامة
    const result = await prisma.$transaction(async (tx) => {
      // البحث عن وجود مسبق لمنع التكرار
      const existing = await tx.purchase.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // إنشاء السجل الجديد
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

    // 4. معالجة الأخطاء
    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    
    return res.status(500).json({ status: "error", message: error.message });
  }
}
