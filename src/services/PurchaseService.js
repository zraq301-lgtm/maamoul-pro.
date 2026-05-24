import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PurchaseService = {
  /**
   * إنشاء طلب شراء مع تفاصيله داخل ترانزكشن واحد
   */
  async createPurchaseOrder(tenantId, orderData, idempotencyKey) {
    return await prisma.$transaction(async (tx) => {
      
      // 1. التحقق الذكي: هل تم تنفيذ هذا الطلب من قبل؟
      const existingOrder = await tx.purchase.findUnique({
        where: { idempotency_key: idempotencyKey }
      });

      if (existingOrder) {
        // إذا كان موجوداً، نعتبره مكرراً
        throw new Error("DUPLICATE_ORDER");
      }

      // 2. إنشاء الطلب الأساسي مع الأصناف المرتبطة به
      const newPurchase = await tx.purchase.create({
        data: {
          tenant_id: tenantId,
          idempotency_key: idempotencyKey,
          total_amount: orderData.totalAmount, // تأكد من مطابقة الاسم في الـ frontend
          status: 'PENDING',
          // ربط الأصناف (Nested Writes) - ميزة قوية في بريزما
          items: {
            create: orderData.items.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
              unit_price: item.price,
            })),
          },
        },
      });

      return newPurchase;
    });
  },
};
