import { PrismaClient } from '@prisma/client';

// نقوم بإنشاء نسخة واحدة فقط من العميل (Singleton)
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
