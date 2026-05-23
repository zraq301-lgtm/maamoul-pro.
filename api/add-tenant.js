import prisma from '../lib/prisma'

export default async function handler(req, res) {
  try {
    const newTenant = await prisma.tenant.create({
      data: { name: "مصنع النور" }
    })
    res.status(200).json(newTenant)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
