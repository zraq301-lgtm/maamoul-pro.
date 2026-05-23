import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  // استقبال البيانات من الواجهة
  if (req.method === 'POST') {
    const { productName, price, supplierId } = req.body;

    try {
      const newProduct = await prisma.product.create({
        data: { name: productName, price, supplierId }
      });
      return res.status(200).json({ status: "success", data: newProduct });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
