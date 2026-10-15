import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import type { SessionPayload } from "@/lib/auth";
import { EstadoTraslado } from "@prisma/client";
import { getVencimientosConsolidados, CATEGORIA_LABEL, type CategoriaVencimiento } from "@/lib/vencimientos-center";
import { diasHasta } from "@/lib/vencimientos";
import { urgenciaConfig } from "@/components/ui/expiry-badge";

export async function getDashboardData(session: SessionPayload) {
  const where = empresaWhere(session);
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [
    activosTotales,
    vehiculos,
    traslados,
    gastosMes,
    combustibleMes,
    activosPorTipo,
    vencimientos,
  ] = await Promise.all([
    prisma.activo.count({ where }),
    prisma.vehiculo.findMany({ where }),
    prisma.traslado.findMany({ where }),
    prisma.gasto.aggregate({
      where: { ...where, fecha: { gte: inicioMes } },
      _sum: { importe: true },
    }),
    prisma.combustibleCarga.aggregate({
      where: { fecha: { gte: inicioMes }, vehiculo: where },
      _sum: { importe: true, litros: true },
    }),
    prisma.activo.groupBy({ by: ["tipo"], where, _count: { _all: true } }),
    getVencimientosConsolidados(session),
  ]);

  // "Requiere atención": vencido o vence dentro de 7 días -- el corte mas
  // urgente del Centro de Vencimientos, pensado para caber en el dashboard
  // sin abrumar. El resto (8-30 dias) queda como "próximos" mas abajo.
  const vencidos = vencimientos.filter((i) => (i.dias ?? 1) < 0);
  const urgentes = vencimientos.filter((i) => i.dias !== null && i.dias >= 0 && i.dias <= 7);
  const proximos30 = vencimientos.filter((i) => i.dias !== null && i.dias > 7 && i.dias <= 30);
  const requiereAtencion = [...vencidos, ...urgentes].sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  const resumenPorCategoria = (Object.keys(CATEGORIA_LABEL) as CategoriaVencimiento[]).map((categoria) => ({
    categoria,
    label: CATEGORIA_LABEL[categoria],
    vencidos: vencidos.filter((i) => i.categoria === categoria).length,
    urgentes: urgentes.filter((i) => i.categoria === categoria).length,
    proximos: proximos30.filter((i) => i.categoria === categoria).length,
  })).filter((r) => r.vencidos + r.urgentes + r.proximos > 0);

  // Actividad reciente: reusa el mismo AuditLog que alimenta /auditoria,
  // pero acotado al dashboard (sin LOGIN, que no es "actividad operativa").
  const actividadReciente = await prisma.auditLog.findMany({
    where: {
      ...(session.rol === "ADMIN" ? {} : { empresaId: session.empresaId }),
      accion: { not: "LOGIN" },
    },
    include: { user: true },
    orderBy: { fecha: "desc" },
    take: 8,
  });

  // Resumen de flota: vehículos con VTV/seguro/service dentro de los
  // próximos 30 días o vencidos -- mismo criterio que el motor de
  // vencimientos (categoría VEHICULO), sin volver a consultar la base.
  const flotaAtencion = vencimientos
    .filter((v) => v.categoria === "VEHICULO")
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0))
    .slice(0, 6);

  // Mantenimientos con próxima fecha vencida o dentro de los próximos 30 días.
  const mantenimientoAtencionCount = vencimientos.filter(
    (v) => v.categoria === "MANTENIMIENTO" && v.dias !== null && v.dias <= 30
  ).length;

  // Serie de 12 meses (incluye combustible) para el gráfico de tendencia --
  // se trae siempre completa y el selector de período (6m/12m) del cliente
  // solo recorta el arreglo, nunca inventa datos.
  const doceMesesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  const [gastosSerie, combustibleSerie] = await Promise.all([
    prisma.gasto.findMany({ where: { ...where, fecha: { gte: doceMesesAtras } }, select: { fecha: true, importe: true, categoria: true } }),
    prisma.combustibleCarga.findMany({ where: { vehiculo: where, fecha: { gte: doceMesesAtras } }, select: { fecha: true, importe: true } }),
  ]);
  const meses: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("es-AR", { month: "short" }) });
  }
  const gastosPorMes = meses.map(({ key, label }) => {
    const [y, m] = key.split("-").map(Number);
    const gastos = gastosSerie
      .filter((g) => g.fecha.getFullYear() === y && g.fecha.getMonth() === m)
      .reduce((s, g) => s + g.importe, 0);
    const combustible = combustibleSerie
      .filter((c) => c.fecha.getFullYear() === y && c.fecha.getMonth() === m)
      .reduce((s, c) => s + c.importe, 0);
    return { mes: label, gastos, combustible };
  });

  // Variación vs. el mes anterior -- señal de tendencia real, no decorativa.
  const totalEsteMes = (gastosMes._sum.importe ?? 0) + (combustibleMes._sum.importe ?? 0);
  const mesAnteriorInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const [gastosMesAnterior, combustibleMesAnterior] = await Promise.all([
    prisma.gasto.aggregate({ where: { ...where, fecha: { gte: mesAnteriorInicio, lt: inicioMes } }, _sum: { importe: true } }),
    prisma.combustibleCarga.aggregate({ where: { vehiculo: where, fecha: { gte: mesAnteriorInicio, lt: inicioMes } }, _sum: { importe: true } }),
  ]);
  const totalMesAnterior = (gastosMesAnterior._sum.importe ?? 0) + (combustibleMesAnterior._sum.importe ?? 0);
  const variacionMensual = totalMesAnterior > 0 ? ((totalEsteMes - totalMesAnterior) / totalMesAnterior) * 100 : null;

  // Gastos por categoría (mismos 12 meses) -- responde "¿dónde estoy
  // gastando?". El combustible cargado en Combustible (no en Gasto) se suma
  // aparte para no subestimarlo: es plata real que sale igual.
  const categorias = new Map<string, number>();
  for (const g of gastosSerie) {
    categorias.set(g.categoria, (categorias.get(g.categoria) ?? 0) + g.importe);
  }
  const combustibleTotal12m = combustibleSerie.reduce((s, c) => s + c.importe, 0);
  if (combustibleTotal12m > 0) {
    categorias.set("COMBUSTIBLE", (categorias.get("COMBUSTIBLE") ?? 0) + combustibleTotal12m);
  }
  const totalGastosPeriodo = Array.from(categorias.values()).reduce((s, v) => s + v, 0);
  const gastosPorCategoria = Array.from(categorias.entries())
    .map(([categoria, total]) => ({ categoria, total, pct: totalGastosPeriodo > 0 ? (total / totalGastosPeriodo) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);

  // Ficha compacta de flota: estado de documentación (seguro/VTV) por
  // vehículo, derivado con el mismo criterio que el Centro de Vencimientos
  // (urgenciaConfig), sin volver a consultar la base.
  const vehiculosDetalle = vehiculos.map((v) => ({
    id: v.id,
    patente: v.patente,
    marca: v.marca,
    modelo: v.modelo,
    estado: v.estado,
    kilometraje: v.kilometraje,
    seguro: urgenciaConfig(diasHasta(v.seguroVencimiento)),
    vtv: urgenciaConfig(diasHasta(v.vtvVencimiento)),
  }));

  return {
    activosTotales,
    vehiculosCount: vehiculos.length,
    vehiculosPorEstado: vehiculos.reduce<Record<string, number>>((acc, v) => {
      acc[v.estado] = (acc[v.estado] ?? 0) + 1;
      return acc;
    }, {}),
    trasladosCount: traslados.length,
    trasladosEnCurso: traslados.filter((t) => t.estado === EstadoTraslado.EN_CURSO).length,
    trasladosPorEstado: {
      PLANIFICADO: traslados.filter((t) => t.estado === EstadoTraslado.PLANIFICADO).length,
      EN_CURSO: traslados.filter((t) => t.estado === EstadoTraslado.EN_CURSO).length,
      COMPLETADO: traslados.filter((t) => t.estado === EstadoTraslado.COMPLETADO).length,
    },
    gastosMes: gastosMes._sum.importe ?? 0,
    combustibleMesImporte: combustibleMes._sum.importe ?? 0,
    combustibleMesLitros: combustibleMes._sum.litros ?? 0,
    activosPorTipo,
    gastosPorMes,
    gastosPorCategoria,
    totalGastosPeriodo,
    variacionMensual,
    vehiculosDetalle,
    vencidosCount: vencidos.length,
    urgentesCount: urgentes.length,
    proximos30Count: proximos30.length,
    requiereAtencion: requiereAtencion.slice(0, 8),
    resumenPorCategoria,
    actividadReciente,
    flotaAtencion,
    mantenimientoAtencionCount,
    vehiculosKmTotal: vehiculos.reduce((s, v) => s + v.kilometraje, 0),
  };
}
