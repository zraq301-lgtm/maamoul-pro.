import { Nile } from '@theniledev/js';

// إعداد عميل Nile
// ملاحظة: تأكد من ضبط متغيرات البيئة في Vercel (NILE_DB_NAME, NILE_USER, إلخ)
const nile = Nile({
  database: process.env.NILE_DB_NAME,
  user: process.env.NILE_USER,
  password: process.env.NILE_PASSWORD,
  host: process.env.NILE_HOST,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { tenantId, orderData, idempotencyKey } = req.body;

    if (!tenantId || !orderData || !idempotencyKey) {
      return res.status(400).json({ message: "Missing required data" });
    }

    // استخدام Nile لإدارة اتصال Prisma الخاص بالمستأجر المحدد
    const db = await nile.tenant(tenantId).prisma();

    // إجراء العملية داخل Transaction
    const result = await db.$transaction(async (tx) => {
      // البحث عن سجل مكرر
      const existing = await tx.purchase.findFirst({
        where: { idempotency_key: String(idempotencyKey) }
      });

      if (existing) {
        throw new Error("DUPLICATE_ORDER");
      }

      // الإنشاء
      return await tx.purchase.create({
        data: {
          tenant_id: String(tenantId),
          idempotency_key: String(idempotencyKey),
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
    console.error("API Error:", error);
    
    if (error.message === "DUPLICATE_ORDER") {
      return res.status(409).json({ status: "error", message: "Order already exists" });
    }
    
    return res.status(500).json({ 
      status: "error", 
      message: error.message 
    });
  }
}
