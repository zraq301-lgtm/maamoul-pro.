import { PrismaClient } from '@prisma/client';

// إعداد الـ Prisma Client (يفضل جعله Singleton لتجنب فتح اتصالات كثيرة)
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

    // لضمان عمل Nile بشكل صحيح، يجب أن نمرر الـ tenantId في الاستعلامات
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. تحديد الـ Tenant في Nile (هذا الجزء هو سر عمل قاعدة البيانات)
      await tx.$executeRaw`SET nile.tenant_id = ${tenantId}::uuid`;

      // 2. البحث عن وجود مسبق (يتم البحث داخل نطاق الـ Tenant الحالي فقط)
      const existing = await tx.purchase.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // 3. إنشاء السجل
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
