// src/services/PurchaseService.js (هذا الملف للموبايل فقط)
import { CapacitorHttp } from '@capacitor/core';

export const PurchaseService = {
  async createPurchaseOrder(tenantId, orderData, idempotencyKey) {
    // هذا الكود يرسل الطلب للسيرفر فقط، ولا يستخدم Prisma
    const response = await CapacitorHttp.post({
      url: 'https://maamoul-pro.vercel.app/api/purchases/create',
      headers: { 'Content-Type': 'application/json' },
      data: { tenantId, orderData, idempotencyKey }
    });

    if (response.status === 409) throw new Error("DUPLICATE_ORDER");
    if (response.status !== 200) throw new Error("SERVER_ERROR");
    
    return response.data;
  }
};
