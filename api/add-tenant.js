import { PrismaClient } from '@prisma/client';

// تعريف prisma هنا مباشرة
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const newTenant = await prisma.tenant.create({
      data: { name: "مصنع النور - " + new Date().toLocaleTimeString() }
    });

    res.status(200).json({
      status: "success",
      message: "تم الاتصال بنجاح",
      data: newTenant
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error",
      message: error.message 
    });
  }
}
