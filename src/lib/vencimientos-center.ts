import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { diasHasta } from "@/lib/vencimientos";
import { tipoActivoLabel, tipoMantenimientoLabel } from "@/lib/format";
import type { SessionPayload } from "@/lib/auth";

// Motor de datos unico para todo lo que tiene fecha de vencimiento en TRAZA:
// activos (incluye calibraciones de equipos medicos), documentacion,
// vehiculos (VTV/seguro/service), mantenimientos programados e impuestos.
// Alimenta tanto el Dashboard ("Requiere atención") como el Centro de
// Vencimientos (/vencimientos). Un solo lugar para agregar una nueva fuente
// de vencimientos en el futuro.

export type CategoriaVencimiento = "ACTIVO" | "DOCUMENTO" | "VEHICULO" | "MANTENIMIENTO" | "IMPUESTO";

export type ItemVencimiento = {
  id: string;
  categoria: CategoriaVencimiento;
  categoriaLabel: string;
  titulo: string;
  detalle: string;
  fecha: Date;
  dias: number | null;
  href: string;
  monto?: number;
};

export async function getVencimientosConsolidados(session: SessionPayload): Promise<ItemVencimiento[]> {
  const where = empresaWhere(session);

  const [activos, documentos, vehiculos, mantenimientos, impuestos] = await Promise.all([
    prisma.activo.findMany({
      where: { ...where, proximoVencimiento: { not: null } },
      include: { ubicacion: true },
    }),
    prisma.documento.findMany({
      where: {
        vencimiento: { not: null },
        OR: [
          { activo: where },
          { vehiculo: where },
          { conductor: where },
          { proveedor: where },
          session.rol === "ADMIN"
            ? { entidadTipo: "EMPRESA" }
            : { entidadTipo: "EMPRESA", entidadId: session.empresaId ?? "__none__" },
        ],
      },
      include: { activo: true, vehiculo: true, conductor: true, proveedor: true },
    }),
    prisma.vehiculo.findMany({ where }),
    prisma.mantenimiento.findMany({
      where: { activo: where, proximaFecha: { not: null } },
      include: { activo: true },
    }),
    prisma.impuesto.findMany({
      where: { ...where, estado: { not: "PAGADO" } },
      include: { vehiculo: true, activo: true },
    }),
  ]);

  const items: ItemVencimiento[] = [];

  for (const a of activos) {
    if (!a.proximoVencimiento) continue;
    const esCalibracion = a.tipo === "EQUIPO_MEDICO";
    items.push({
      id: `activo-${a.id}`,
      categoria: "ACTIVO",
      categoriaLabel: esCalibracion ? "Calibración" : tipoActivoLabel(a.tipo),
      titulo: `${a.codigo} · ${a.nombre}`,
      detalle: a.ubicacion?.nombre ?? "Sin ubicación",
      fecha: a.proximoVencimiento,
      dias: diasHasta(a.proximoVencimiento),
      href: `/activos/${a.id}`,
    });
  }

  for (const d of documentos) {
    if (!d.vencimiento) continue;
    const entidadLabel =
      d.activo?.nombre ??
      (d.vehiculo ? `${d.vehiculo.patente} · ${d.vehiculo.marca}` : undefined) ??
      (d.conductor ? `${d.conductor.nombre} ${d.conductor.apellido}` : undefined) ??
      d.proveedor?.nombre ??
      "Empresa";
    const href = d.activoId ? `/activos/${d.activoId}` : d.vehiculoId ? `/flota/${d.vehiculoId}` : "/documentacion";
    items.push({
      id: `doc-${d.id}`,
      categoria: "DOCUMENTO",
      categoriaLabel: "Documentación",
      titulo: d.tipo,
      detalle: entidadLabel,
      fecha: d.vencimiento,
      dias: diasHasta(d.vencimiento),
      href,
    });
  }

  for (const v of vehiculos) {
    const campos: [Date | null, string, CategoriaVencimiento][] = [
      [v.vtvVencimiento, "VTV", "VEHICULO"],
      [v.seguroVencimiento, "Seguro", "VEHICULO"],
      [v.serviceProximo, "Service", "MANTENIMIENTO"],
    ];
    for (const [fecha, label, categoria] of campos) {
      if (!fecha) continue;
      items.push({
        id: `veh-${v.id}-${label}`,
        categoria,
        categoriaLabel: categoria === "MANTENIMIENTO" ? "Mantenimiento" : "Flota",
        titulo: `${v.patente} · ${v.marca} ${v.modelo}`,
        detalle: label,
        fecha,
        dias: diasHasta(fecha),
        href: `/flota/${v.id}`,
      });
    }
  }

  for (const m of mantenimientos) {
    if (!m.proximaFecha) continue;
    items.push({
      id: `mant-${m.id}`,
      categoria: "MANTENIMIENTO",
      categoriaLabel: "Mantenimiento",
      titulo: `${m.activo.codigo} · ${m.activo.nombre}`,
      detalle: tipoMantenimientoLabel(m.tipo),
      fecha: m.proximaFecha,
      dias: diasHasta(m.proximaFecha),
      href: `/activos/${m.activoId}`,
    });
  }

  for (const i of impuestos) {
    items.push({
      id: `imp-${i.id}`,
      categoria: "IMPUESTO",
      categoriaLabel: "Impuestos",
      titulo: i.nombre,
      detalle: i.vehiculo ? `${i.vehiculo.patente}` : i.activo ? `${i.activo.codigo}` : "General",
      fecha: i.vencimiento,
      dias: diasHasta(i.vencimiento),
      href: `/impuestos/${i.id}/editar`,
      monto: i.importe,
    });
  }

  items.sort((a, b) => (a.dias ?? 999999) - (b.dias ?? 999999));
  return items;
}

export const CATEGORIA_LABEL: Record<CategoriaVencimiento, string> = {
  ACTIVO: "Activos",
  DOCUMENTO: "Documentación",
  VEHICULO: "Flota",
  MANTENIMIENTO: "Mantenimiento",
  IMPUESTO: "Impuestos",
};
