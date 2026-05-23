// services/PurchaseService.js
import prisma from '../lib/prisma'; // كائن Prisma الموحد

export const PurchaseService = {
  // إضافة مورد جديد
  async createSupplier(data) {
    return await prisma.supplier.create({ data });
  },

  // تسجيل طلب شراء (بمعاملة ذكية - Transaction)
  async createPurchaseOrder(tenantId, orderData) {
    return await prisma.$transaction(async (tx) => {
      // 1. إنشاء الفاتورة
      const order = await tx.order.create({
        data: {
          tenantId,
          total: orderData.total,
          status: 'PENDING'
        }
      });
      // 2. تحديث المخزون (هنا يبدأ الذكاء)
      // ... إضافة منطق تحديث المخزن هنا
      return order;
    });
  }
};
