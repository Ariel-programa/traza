import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

export async function logAudit(
  session: SessionPayload,
  accion: string,
  entidad: string,
  entidadId?: string,
  detalle?: string
) {
  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      empresaId: session.empresaId,
      accion,
      entidad,
      entidadId,
      detalle,
    },
  });
}
