import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from './generated/prisma/client';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const extendedPrisma = () =>
  new PrismaClient({ adapter }).$extends({
    model: {
      $allModels: {
        async $exists<T>(
          this: T,
          where: Prisma.Args<T, 'findFirst'>['where']
        ): Promise<boolean> {
          const context = Prisma.getExtensionContext(this);
          const result = await (context as any).findFirst({ where });
          return result !== null;
        },
      },
    },
  });

type ExtendedPrismaClient = ReturnType<typeof extendedPrisma>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma ?? extendedPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
