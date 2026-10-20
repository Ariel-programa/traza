import { PrismaClient } from "@prisma/client";

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // El hash de contraseña nunca sale de una consulta salvo que se pida
    // explícitamente (`omit: { passwordHash: false }`, solo en el login): así
    // un `include: { user: true }` o un findMany pasado a un componente
    // cliente no puede filtrarlo al navegador.
    omit: { user: { passwordHash: true } },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
