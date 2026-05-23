import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // 1. اختبار الاتصال الأساسي
    await prisma.$connect();

    // 2. محاولة إنشاء سجل (تجربة فعلية)
    const newTenant = await prisma.tenant.create({
      data: { name: "مصنع النور التجريبي" }
    });

    res.status(200).json({
      status: "success",
      message: "تم الاتصال بنجاح بقاعدة بيانات Nile!",
      data: newTenant
    });

  } catch (error) {
    // 3. تحليل الخطأ بشكل احترافي
    console.error("خطأ في الاتصال:", error);
    
    res.status(500).json({
      status: "error",
      message: "فشل الاتصال بقاعدة البيانات",
      details: error.message,
      tip: "تأكد من إعداد DATABASE_URL في Vercel، وتأكد أنك قمت بعمل npx prisma db push في مشروعك."
    });
  } finally {
    await prisma.$disconnect();
  }
}
