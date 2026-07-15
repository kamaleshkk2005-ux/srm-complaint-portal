import { PrismaClient } from '@prisma/client';
import logger from './logger';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'error' },
        ],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Type-safe event handlers using type assertions
(prisma as any).$on('error', (e: unknown) => {
  logger.error('Prisma error:', e);
});

(prisma as any).$on('warn', (e: unknown) => {
  logger.warn('Prisma warning:', e);
});

if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    logger.debug(`Prisma Query: ${e.query} - Duration: ${e.duration}ms`);
  });
}

export default prisma;
