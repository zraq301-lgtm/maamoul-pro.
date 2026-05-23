import { PrismaClient } from '@prisma/client';

// تعريف الـ PrismaClient مباشرة داخل الملف
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // إضافة رأس للطلب للسماح بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const newTenant = await prisma.tenant.create({
      data: { name: "مصنع النور" }
    });
    res.status(200).json(newTenant);
  } catch (error) {
    console.error("خطأ بريزما:", error);
    res.status(500).json({ error: error.message });
  }
}
