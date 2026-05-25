// lib/nile.js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;
// هنا نستخدم DATABASE_URL الذي ستضعه في Vercel
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
