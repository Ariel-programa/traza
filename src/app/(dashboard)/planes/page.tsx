import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { Check } from "lucide-react";
import { contratarPlanDemo } from "./actions";

const FEATURE_LABEL: Record<string, string> = {
  activos: "Gestión de activos", qr: "Códigos QR", mantenimiento_basico: "Mantenimiento básico",
  mantenimiento: "Mantenimiento completo", dashboard: "Dashboard", proveedores: "Proveedores",
  documentacion: "Documentación", alertas: "Alertas", reportes: "Reportes",
  automatizaciones: "Automatizaciones (n8n)", flota: "Flota", logistica: "Logística",
  combustible: "Combustible", gastos: "Gastos", usuarios_multiples: "Usuarios múltiples",
};

export default async function PlanesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const planes = await prisma.plan.findMany({ orderBy: { precioMensual: "asc" } });

  if (!session.empresaId) {
    const empresas = await prisma.empresa.findMany({ include: { suscripcion: { include: { plan: true } } } });
    return (
      <div>
        <PageHeader title="Planes" description="Vista administrativa de suscripciones por empresa." />
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          {empresas.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium">{e.nombre}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)]">{e.suscripcion?.plan.nombre ?? "Sin plan"}</span>
                {e.suscripcion && <StatusBadge estado={e.suscripcion.estado} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const [suscripcion, activosCount, pagos] = await Promise.all([
    prisma.suscripcion.findUnique({ where: { empresaId: session.empresaId }, include: { plan: true } }),
    prisma.activo.count({ where: { empresaId: session.empresaId } }),
    prisma.pago.findMany({
      where: { suscripcion: { empresaId: session.empresaId } },
      orderBy: { fecha: "desc" },
      take: 10,
    }),
  ]);

  const canManage = session.rol === "ADMIN" || session.rol === "EMPRESA";

  return (
    <div>
      <PageHeader title="Planes" description="Tu suscripción actual, límites de uso e historial de pagos." />

      {suscripcion && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Plan {suscripcion.plan.nombre}</CardTitle>
              <CardDescription>
                Renueva el {formatDate(suscripcion.fechaRenovacion)} · {formatCurrency(suscripcion.plan.precioMensual)}/mes
              </CardDescription>
            </div>
            <StatusBadge estado={suscripcion.estado} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Activos utilizados: <span className="font-medium text-[var(--text-primary)]">{activosCount} / {suscripcion.plan.limiteActivos}</span>
            </p>
            <div className="h-1.5 w-full max-w-xs rounded-full bg-[var(--neutral-soft)] overflow-hidden">
              <div
                className="h-full bg-[var(--brand)]"
                style={{ width: `${Math.min(100, (activosCount / suscripcion.plan.limiteActivos) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {planes.map((plan) => {
          const features = JSON.parse(plan.features) as string[];
          const esActual = suscripcion?.planId === plan.id;
          return (
            <Card key={plan.id} className={esActual ? "ring-2 ring-[var(--brand)]" : ""}>
              <CardHeader>
                <CardTitle>{plan.nombre}</CardTitle>
                <CardDescription>{plan.precioMensual === 0 ? "Gratis" : `${formatCurrency(plan.precioMensual)}/mes`}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm mb-4">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Check className="h-3.5 w-3.5 text-[var(--success)]" /> {FEATURE_LABEL[f] ?? f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--text-muted)] mb-3">Hasta {plan.limiteActivos} activos · {plan.limiteUsuarios} usuarios</p>
                {canManage && (
                  esActual ? (
                    <Button variant="secondary" className="w-full" disabled>Plan actual</Button>
                  ) : (
                    <form action={contratarPlanDemo.bind(null, plan.id)}>
                      <Button type="submit" className="w-full" variant={plan.nombre === "EMPRESA" ? "primary" : "secondary"}>
                        Contratar (demo)
                      </Button>
                    </form>
                  )
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Historial de pagos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {pagos.length === 0 ? (
            <EmptyState title="Sin pagos registrados" />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {pagos.map((p) => (
                <li key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDate(p.fecha)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Método: {p.metodo}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(p.monto)}</span>
                    <StatusBadge estado={p.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
