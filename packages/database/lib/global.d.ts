// This file ensures TypeScript knows globalThis.prisma exists

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export {};
