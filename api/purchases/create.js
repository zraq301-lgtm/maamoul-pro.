import { PrismaClient } from '@prisma/client';

// تعريف العميل خارج الـ handler لضمان إعادة استخدامه (Connection Pooling)
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // التحقق من طريقة الطلب
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { tenantId, orderData, idempotencyKey } = req.body;

    // التحقق من البيانات الأساسية
    if (!tenantId || !orderData || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // تجهيز البيانات
    const tId = String(tenantId);
    const iKey = String(idempotencyKey);

    // استخدام Transaction لضمان سلامة البيانات
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. البحث باستخدام tenant_id لضمان عزل البيانات (Multi-tenancy isolation)
      const existing = await tx.purchase.findFirst({
        where: { 
          tenant_id: tId,
          idempotency_key: iKey 
        }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // 2. إنشاء الطلب مع ربطه بالمستأجر
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
    console.error("API Error Details:", error);
    
    // معالجة الأخطاء المحددة
    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    
    return res.status(500).json({ 
      status: "error", 
      message: error.message || "Internal Server Error" 
    });
  }
}
