import { PrismaClient } from '../prisma/node_modules/.prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Add type annotation here
export const prisma: PrismaClient = 
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
