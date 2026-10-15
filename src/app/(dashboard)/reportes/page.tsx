import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency, tipoActivoLabel, tipoMantenimientoLabel, categoriaGastoLabel } from "@/lib/format";

export default async function ReportesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const where = empresaWhere(session);

  const [
    activosPorTipo,
    activosPorEstado,
    mantenimientosPorTipo,
    proveedoresPorServicio,
    gastosPorCategoria,
    trasladosPorEstado,
    combustibleTotal,
    vehiculosPorEstado,
    impuestosPorEstado,
    gastosConVehiculo,
  ] = await Promise.all([
    prisma.activo.groupBy({ by: ["tipo"], where, _count: { _all: true } }),
    prisma.activo.groupBy({ by: ["estado"], where, _count: { _all: true } }),
    prisma.mantenimiento.groupBy({ by: ["tipo"], where: { activo: where }, _count: { _all: true } }),
    prisma.proveedor.groupBy({ by: ["servicio"], where, _count: { _all: true } }),
    prisma.gasto.groupBy({ by: ["categoria"], where, _sum: { importe: true } }),
    prisma.traslado.groupBy({ by: ["estado"], where, _count: { _all: true } }),
    prisma.combustibleCarga.aggregate({ where: { vehiculo: where }, _sum: { importe: true, litros: true } }),
    prisma.vehiculo.groupBy({ by: ["estado"], where, _count: { _all: true } }),
    prisma.impuesto.groupBy({ by: ["estado"], where, _sum: { importe: true } }),
    prisma.gasto.findMany({ where: { ...where, vehiculoId: { not: null } }, include: { vehiculo: true } }),
  ]);

  const gastoPorVehiculo = Object.values(
    gastosConVehiculo.reduce<Record<string, { patente: string; total: number }>>((acc, g) => {
      if (!g.vehiculo) return acc;
      acc[g.vehiculo.id] ??= { patente: g.vehiculo.patente, total: 0 };
      acc[g.vehiculo.id].total += g.importe;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <div>
      <PageHeader title="Reportes" description="Resumen agregado de activos, mantenimiento, proveedores, flota y gastos." />

      <div className="grid lg:grid-cols-2 gap-4">
        <ReportCard title="Activos por tipo" description="Distribución de activos según su tipo.">
          {activosPorTipo.map((r) => (
            <Row key={r.tipo} label={tipoActivoLabel(r.tipo)} value={r._count._all} />
          ))}
        </ReportCard>

        <ReportCard title="Activos por estado" description="Estado de vencimiento de los activos.">
          {activosPorEstado.map((r) => (
            <Row key={r.estado} label={r.estado} value={r._count._all} />
          ))}
        </ReportCard>

        <ReportCard title="Mantenimientos por tipo" description="Intervenciones registradas por tipo.">
          {mantenimientosPorTipo.length === 0 ? <Empty /> : mantenimientosPorTipo.map((r) => (
            <Row key={r.tipo} label={tipoMantenimientoLabel(r.tipo)} value={r._count._all} />
          ))}
        </ReportCard>

        <ReportCard title="Proveedores por servicio" description="Cantidad de proveedores según el servicio que ofrecen.">
          {proveedoresPorServicio.length === 0 ? <Empty /> : proveedoresPorServicio.map((r) => (
            <Row key={r.servicio} label={r.servicio} value={r._count._all} />
          ))}
        </ReportCard>

        <ReportCard title="Gastos por categoría" description="Importe total gastado por categoría.">
          {gastosPorCategoria.length === 0 ? <Empty /> : gastosPorCategoria.map((r) => (
            <Row key={r.categoria} label={categoriaGastoLabel(r.categoria)} value={formatCurrency(r._sum.importe ?? 0)} />
          ))}
        </ReportCard>

        <ReportCard title="Flota" description="Estado de vehículos y consumo de combustible.">
          {vehiculosPorEstado.map((r) => (
            <Row key={r.estado} label={r.estado} value={r._count._all} />
          ))}
          <div className="pt-2 mt-2 border-t border-[var(--border)]">
            <Row label="Combustible total" value={formatCurrency(combustibleTotal._sum.importe ?? 0)} />
            <Row label="Litros totales" value={`${(combustibleTotal._sum.litros ?? 0).toFixed(0)} L`} />
          </div>
        </ReportCard>

        <ReportCard title="Traslados por estado" description="Estado actual de los traslados de logística.">
          {trasladosPorEstado.length === 0 ? <Empty /> : trasladosPorEstado.map((r) => (
            <Row key={r.estado} label={r.estado} value={r._count._all} />
          ))}
        </ReportCard>

        <ReportCard title="Impuestos" description="Importe total por estado de pago.">
          {impuestosPorEstado.length === 0 ? <Empty /> : impuestosPorEstado.map((r) => (
            <Row key={r.estado} label={r.estado} value={formatCurrency(r._sum.importe ?? 0)} />
          ))}
        </ReportCard>

        <ReportCard title="Gasto por vehículo" description="Los vehículos con mayor gasto acumulado (excluye combustible).">
          {gastoPorVehiculo.length === 0 ? <Empty /> : gastoPorVehiculo.map((r) => (
            <Row key={r.patente} label={r.patente} value={formatCurrency(r.total)} />
          ))}
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-[var(--text-muted)]">Sin datos todavía.</p>;
}
