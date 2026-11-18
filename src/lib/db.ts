import 'server-only';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 requires a driver adapter. Use the DATABASE_URL pooler at runtime.
// Limit connections per server instance for a small demonstration storefront.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function makePrisma() {
  const adapter = new PrismaPg({ connectionString, max: 3, connectionTimeoutMillis: 5000 });
  return new PrismaClient({ adapter, log: ['error'] });
}
export const db = globalForPrisma.prisma ?? makePrisma();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
