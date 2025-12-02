import { PrismaClient } from '@prisma/client';

// Create a single Prisma Client instance
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;
