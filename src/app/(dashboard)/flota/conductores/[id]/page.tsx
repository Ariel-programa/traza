import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatDate, formatCurrency } from "@/lib/format";
import { diasHasta } from "@/lib/vencimientos";
import { Pencil, Route as RouteIcon, Fuel } from "lucide-react";
import { deleteConductor } from "../../actions";

export default async function ConductorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const { error } = await searchParams;

  const conductor = await prisma.conductor.findUnique({
    where: { id },
    include: {
      empresa: true,
      documentos: { orderBy: { vencimiento: "asc" } },
      traslados: { include: { vehiculo: true }, orderBy: { fecha: "desc" }, take: 8 },
      cargas: { include: { vehiculo: true }, orderBy: { fecha: "desc" }, take: 8 },
    },
  });

  if (!conductor) notFound();
  if (session.rol !== "ADMIN" && conductor.empresaId !== session.empresaId) notFound();

  return (
    <div>
      <PageHeader
        title={`${conductor.nombre} ${conductor.apellido}`}
        description={conductor.empresa.nombre}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/flota/conductores/${conductor.id}/editar`}><Pencil className="h-3.5 w-3.5" /> Editar</Link>
            </Button>
            {puedeEliminar(session.rol) && (
              <DeleteButton
                action={deleteConductor.bind(null, conductor.id)}
                confirmMessage={`¿Eliminar a ${conductor.nombre} ${conductor.apellido}?`}
              />
            )}
          </>
        }
      />

      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este conductor porque tiene traslados, cargas de combustible, documentos o un usuario asociado.
          Para conservar la trazabilidad, primero tendrías que desvincular ese historial.
        </ErrorBanner>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información general</CardTitle>
            <StatusBadge estado={conductor.estado} />
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Documento" value={conductor.documento ?? "—"} />
              <Info label="Teléfono" value={conductor.telefono ?? "—"} />
              <Info label="Licencia" value={conductor.licencia ?? "—"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vencimientos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Licencia de conducir</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDate(conductor.licenciaVencimiento)}</p>
              </div>
              <ExpiryBadge dias={diasHasta(conductor.licenciaVencimiento)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader><CardTitle>Traslados recientes</CardTitle></CardHeader>
          <CardContent className="p-0">
            {conductor.traslados.length === 0 ? (
              <EmptyState title="Sin traslados" description="Este conductor todavía no tiene traslados registrados." icon={<RouteIcon className="h-6 w-6" />} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {conductor.traslados.map((t) => (
                  <li key={t.id}>
                    <Link href={`/logistica/${t.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)]">
                      <div>
                        <p className="text-sm font-medium">{t.origen} → {t.destino}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(t.fecha)} {t.vehiculo ? `· ${t.vehiculo.patente}` : ""}</p>
                      </div>
                      <StatusBadge estado={t.estado} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cargas de combustible</CardTitle></CardHeader>
          <CardContent className="p-0">
            {conductor.cargas.length === 0 ? (
              <EmptyState title="Sin cargas" description="Este conductor todavía no registró cargas de combustible." icon={<Fuel className="h-6 w-6" />} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {conductor.cargas.map((c) => (
                  <li key={c.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.litros.toFixed(0)} L {c.vehiculo ? `· ${c.vehiculo.patente}` : ""}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(c.fecha)}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(c.importe)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {conductor.documentos.length > 0 && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Documentación</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--border)]">
              {conductor.documentos.map((d) => (
                <li key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.tipo}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.numero ?? "—"} · Vence {formatDate(d.vencimiento)}</p>
                  </div>
                  <StatusBadge estado={d.estado} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[var(--text-primary)] font-medium">{value}</dd>
    </div>
  );
}
