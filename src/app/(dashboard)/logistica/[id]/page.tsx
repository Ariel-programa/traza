import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatCurrency, categoriaGastoLabel } from "@/lib/format";
import { Plus } from "lucide-react";
import { deleteTraslado } from "../actions";
import { EstadoButtons } from "../estado-buttons";

export default async function TrasladoDetailPage({
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

  const traslado = await prisma.traslado.findUnique({
    where: { id },
    include: { vehiculo: true, conductor: true, gastos: { include: { proveedor: true } } },
  });
  if (!traslado) notFound();
  if (session.rol !== "ADMIN" && traslado.empresaId !== session.empresaId) notFound();

  const costoTotal = traslado.gastos.reduce((sum, g) => sum + g.importe, 0);

  return (
    <div>
      <PageHeader
        title={`Traslado ${traslado.numero}`}
        description={`${traslado.origen} → ${traslado.destino}`}
        actions={<DeleteButton action={deleteTraslado.bind(null, id)} confirmMessage={`¿Eliminar el traslado ${traslado.numero}?`} />}
      />

      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este traslado porque tiene gastos asociados. Para conservar la trazabilidad, primero tendrías
          que eliminar esos gastos.
        </ErrorBanner>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detalle</CardTitle>
            <StatusBadge estado={traslado.estado} />
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
              <Info label="Fecha" value={formatDate(traslado.fecha)} />
              <Info label="Cliente" value={traslado.cliente ?? "—"} />
              <Info label="Vehículo" value={traslado.vehiculo ? `${traslado.vehiculo.patente} · ${traslado.vehiculo.marca}` : "—"} />
              <Info label="Conductor" value={traslado.conductor ? `${traslado.conductor.nombre} ${traslado.conductor.apellido}` : "—"} />
            </dl>
            {traslado.observaciones && <p className="text-sm text-[var(--text-secondary)] mb-4">{traslado.observaciones}</p>}
            <EstadoButtons id={id} actual={traslado.estado} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Costo del traslado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(costoTotal)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Suma de gastos asociados (combustible, peajes, otros).</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gastos asociados</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/gastos/nuevo?trasladoId=${id}`}><Plus className="h-3.5 w-3.5" /> Agregar gasto</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {traslado.gastos.length === 0 ? (
            <EmptyState title="Sin gastos asociados" description="Agregá peajes, combustible u otros gastos de este traslado." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {traslado.gastos.map((g) => (
                <li key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{categoriaGastoLabel(g.categoria)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(g.fecha)} {g.proveedor ? `· ${g.proveedor.nombre}` : ""}</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(g.importe)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[var(--text-primary)] font-medium">{value}</dd>
    </div>
  );
}
