import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import type { SessionPayload } from "@/lib/auth";

export async function getFormOptions(session: SessionPayload) {
  const where = empresaWhere(session);
  const [empresas, ubicaciones, proveedores, tecnicos, vehiculos, conductores] = await Promise.all([
    prisma.empresa.findMany({ where: session.rol === "ADMIN" ? {} : { id: session.empresaId ?? "" }, orderBy: { nombre: "asc" } }),
    prisma.ubicacion.findMany({ where, orderBy: { nombre: "asc" } }),
    prisma.proveedor.findMany({ where, orderBy: { nombre: "asc" } }),
    prisma.tecnico.findMany({ where, orderBy: { nombre: "asc" } }),
    prisma.vehiculo.findMany({ where, orderBy: { patente: "asc" } }),
    prisma.conductor.findMany({ where, orderBy: { nombre: "asc" } }),
  ]);
  return { empresas, ubicaciones, proveedores, tecnicos, vehiculos, conductores };
}
