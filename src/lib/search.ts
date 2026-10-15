"use server";

import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { getSession } from "@/lib/auth";
import { tipoActivoLabel } from "@/lib/format";

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  group: "Activos" | "Vehículos" | "Proveedores" | "Conductores" | "Traslados";
  href: string;
};

// Motor único de búsqueda global: lo usa tanto /buscar (página completa)
// como el Command Palette (Ctrl+K, resultados en vivo). Mismo criterio de
// scoping por empresa que el resto de la plataforma.
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const session = await getSession();
  if (!session) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const where = empresaWhere(session);

  const [activos, proveedores, vehiculos, conductores, traslados] = await Promise.all([
    prisma.activo.findMany({
      where: {
        ...where,
        OR: [
          { codigo: { contains: q, mode: "insensitive" } },
          { nombre: { contains: q, mode: "insensitive" } },
          { numeroSerie: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
    }),
    prisma.proveedor.findMany({ where: { ...where, nombre: { contains: q, mode: "insensitive" } }, take: 5 }),
    prisma.vehiculo.findMany({
      where: { ...where, OR: [{ patente: { contains: q, mode: "insensitive" } }, { marca: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    prisma.conductor.findMany({
      where: { ...where, OR: [{ nombre: { contains: q, mode: "insensitive" } }, { apellido: { contains: q, mode: "insensitive" } }] },
      take: 5,
    }),
    prisma.traslado.findMany({
      where: {
        ...where,
        OR: [
          { numero: { contains: q, mode: "insensitive" } },
          { origen: { contains: q, mode: "insensitive" } },
          { destino: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [
    ...activos.map((a) => ({
      id: `activo-${a.id}`,
      title: `${a.codigo} · ${a.nombre}`,
      subtitle: tipoActivoLabel(a.tipo),
      group: "Activos" as const,
      href: `/activos/${a.id}`,
    })),
    ...proveedores.map((p) => ({
      id: `proveedor-${p.id}`,
      title: p.nombre,
      subtitle: p.servicio,
      group: "Proveedores" as const,
      href: `/proveedores/${p.id}`,
    })),
    ...vehiculos.map((v) => ({
      id: `vehiculo-${v.id}`,
      title: `${v.patente} · ${v.marca} ${v.modelo}`,
      subtitle: "Vehículo",
      group: "Vehículos" as const,
      href: "/flota",
    })),
    ...conductores.map((c) => ({
      id: `conductor-${c.id}`,
      title: `${c.nombre} ${c.apellido}`,
      subtitle: "Conductor",
      group: "Conductores" as const,
      href: "/flota/conductores",
    })),
    ...traslados.map((t) => ({
      id: `traslado-${t.id}`,
      title: t.numero,
      subtitle: `${t.origen} → ${t.destino}`,
      group: "Traslados" as const,
      href: `/logistica/${t.id}`,
    })),
  ];

  return results;
}
