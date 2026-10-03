import { PrismaClient } from '@prisma/client';

// Reuse one PrismaClient across hot reloads in development and across
// invocations of the same serverless instance in production.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__climateiqPrisma ||
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__climateiqPrisma = prisma;

export default prisma;
