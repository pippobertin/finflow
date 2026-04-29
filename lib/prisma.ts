import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

let _prismaInstance: PrismaClient | undefined;

function getPrismaInstance(): PrismaClient {
  if (_prismaInstance) return _prismaInstance;
  if (globalForPrisma.prisma) {
    _prismaInstance = globalForPrisma.prisma;
    return _prismaInstance;
  }
  _prismaInstance = createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prismaInstance;
  return _prismaInstance;
}

// Lazy proxy: il PrismaClient viene istanziato solo al primo vero utilizzo
// (es. prisma.user.findMany(...)), non al caricamento del modulo. Questo evita
// che Next.js fallisca durante "collect page data" su Vercel a build time
// per side effects della creazione del client.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
