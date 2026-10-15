import type { SessionPayload } from "@/lib/auth";

// Devuelve el filtro de empresa a aplicar en las consultas Prisma según el rol.
// ADMIN ve todas las empresas; el resto de los roles queda acotado a la suya.
export function empresaWhere(session: SessionPayload): { empresaId?: string } {
  if (session.rol === "ADMIN") return {};
  return { empresaId: session.empresaId ?? "__none__" };
}
