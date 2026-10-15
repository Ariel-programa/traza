import { prisma } from "@/lib/prisma";

// Empresas sin suscripcion (o el usuario ADMIN, que no tiene empresaId) no
// tienen limite: son casos administrativos, no clientes del SaaS.
async function limiteDe(empresaId: string | null, campo: "limiteActivos" | "limiteUsuarios") {
  if (!empresaId) return null;
  const suscripcion = await prisma.suscripcion.findUnique({
    where: { empresaId },
    include: { plan: true },
  });
  return suscripcion?.plan[campo] ?? null;
}

export async function verificarLimiteActivos(empresaId: string | null): Promise<string | null> {
  const limite = await limiteDe(empresaId, "limiteActivos");
  if (limite === null) return null;
  const count = await prisma.activo.count({ where: { empresaId: empresaId! } });
  if (count >= limite) {
    return `Alcanzaste el límite de ${limite} activos de tu plan. Contratá un plan superior en Planes para seguir agregando.`;
  }
  return null;
}

export async function verificarLimiteUsuarios(empresaId: string | null): Promise<string | null> {
  const limite = await limiteDe(empresaId, "limiteUsuarios");
  if (limite === null) return null;
  const count = await prisma.user.count({ where: { empresaId: empresaId! } });
  if (count >= limite) {
    return `Alcanzaste el límite de ${limite} usuarios de tu plan. Contratá un plan superior en Planes para seguir agregando.`;
  }
  return null;
}
