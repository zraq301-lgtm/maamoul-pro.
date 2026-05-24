// داخل src/services/PurchaseService.js
import { PrismaClient } from '@prisma/client';

// تعريف الـ Client مع مراعاة بيئة الـ Serverless واستخدام NILEDB_URL
const globalForPrisma = global;
export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.NILEDB_URL, // استخدام المتغير الصحيح الخاص بقاعدة بياناتك
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const PurchaseService = {
  async createPurchaseOrder(tenantId, orderData, idempotencyKey) {
    // نستخدم transaction لضمان أن العملية تكتمل أو تفشل ككتلة واحدة
    return await prisma.$transaction(async (tx) => {
      
      // نبحث أولاً عن المفتاح لمنع التكرار
      const existing = await tx.purchase.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existing) return existing; // إذا موجود، لا تفعل شيئاً وأعد البيانات القديمة

      // إنشاء الطلب
      return await tx.purchase.create({
        data: {
          tenant_id: tenantId,
          idempotency_key: idempotencyKey,
          total_amount: orderData.total,
          items: {
            create: orderData.items // افترضنا أن الـ Items مجهزة مسبقاً
          }
        }
      });
    });
  }
};
