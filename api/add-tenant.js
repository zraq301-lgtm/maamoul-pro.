import { PrismaClient } from '@prisma/client';

// تعريف prisma
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // نضيف شرط تجريبي للتحقق من أن الكود يعمل
  try {
    // محاولة إنشاء مصنع تجريبي
    const newTenant = await prisma.tenant.create({
      data: { name: "مصنع النور - " + new Date().toLocaleTimeString() }
    });

    // رسالة نجاح واضحة للمتصفح
    res.status(200).json({
      message: "✅ تم الاتصال بقاعدة البيانات بنجاح!",
      details: "تم إنشاء سجل جديد في جدول Tenants",
      data: newTenant
    });
    
  } catch (error) {
    // رسالة خطأ واضحة للمتصفح
    res.status(500).json({
      message: "❌ فشل الاتصال بقاعدة البيانات",
      error: error.message,
      hint: "تأكد من إعداد DATABASE_URL في Vercel بشكل صحيح"
    });
  }
}
