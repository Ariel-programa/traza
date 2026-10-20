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
import { formatDate, formatCurrency, formatRelativo, categoriaGastoLabel } from "@/lib/format";
import { diasHasta } from "@/lib/vencimientos";
import { Pencil, Plus, Fuel, Route as RouteIcon } from "lucide-react";
import { deleteVehiculo } from "../actions";
import { QuickScanButton } from "@/app/(dashboard)/combustible/quick-scan-button";
import { UbicacionButton } from "../ubicacion-button";
import { VehiculosMap } from "@/components/ui/vehiculos-map";

export default async function VehiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const vehiculo = await prisma.vehiculo.findUnique({
    where: { id },
    include: {
      empresa: true,
      documentos: { orderBy: { vencimiento: "asc" } },
      impuestos: { orderBy: { vencimiento: "asc" } },
      gastos: { include: { proveedor: true }, orderBy: { fecha: "desc" }, take: 8 },
      cargas: { orderBy: { fecha: "desc" }, take: 8 },
      traslados: { include: { conductor: true }, orderBy: { fecha: "desc" }, take: 8 },
    },
  });

  if (!vehiculo) notFound();
  if (session.rol !== "ADMIN" && vehiculo.empresaId !== session.empresaId) notFound();

  const gastoTotal = vehiculo.gastos.reduce((s, g) => s + g.importe, 0);
  const combustibleTotal = vehiculo.cargas.reduce((s, c) => s + c.importe, 0);
  const litrosTotal = vehiculo.cargas.reduce((s, c) => s + c.litros, 0);

  return (
    <div>
      <PageHeader
        title={vehiculo.patente}
        description={`${vehiculo.marca} ${vehiculo.modelo}${vehiculo.anio ? ` (${vehiculo.anio})` : ""}`}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/combustible/nuevo?vehiculoId=${vehiculo.id}`}><Fuel className="h-3.5 w-3.5" /> Cargar combustible</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/flota/${vehiculo.id}/editar`}><Pencil className="h-3.5 w-3.5" /> Editar</Link>
            </Button>
            {puedeEliminar(session.rol) && (
              <DeleteButton action={deleteVehiculo.bind(null, vehiculo.id)} confirmMessage={`¿Eliminar el vehículo ${vehiculo.patente}?`} />
            )}
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información general</CardTitle>
            <StatusBadge estado={vehiculo.estado} />
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Empresa" value={vehiculo.empresa.nombre} />
              <Info label="Tipo" value={vehiculo.tipo} />
              <Info label="Marca / Modelo" value={`${vehiculo.marca} ${vehiculo.modelo}`} />
              <Info label="Año" value={vehiculo.anio?.toString() ?? "—"} />
              <Info label="Kilometraje" value={`${vehiculo.kilometraje.toLocaleString("es-AR")} km`} />
              <Info label="Alta en TRAZA" value={formatDate(vehiculo.createdAt)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vencimientos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <VencimientoRow label="VTV / Revisión técnica" fecha={vehiculo.vtvVencimiento} />
            <VencimientoRow label="Seguro" fecha={vehiculo.seguroVencimiento} />
            <VencimientoRow label="Próximo service" fecha={vehiculo.serviceProximo} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ubicación</CardTitle>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {vehiculo.ubicacionActualizada
                ? `Última actualización ${formatRelativo(vehiculo.ubicacionActualizada)}`
                : "Sin ubicación cargada. Sin GPS instalado: se actualiza a mano."}
            </p>
          </div>
          <UbicacionButton vehiculoId={vehiculo.id} />
        </CardHeader>
        <CardContent>
          <VehiculosMap
            vehiculos={
              vehiculo.ubicacionLat != null && vehiculo.ubicacionLng != null
                ? [
                    {
                      id: vehiculo.id,
                      patente: vehiculo.patente,
                      marca: vehiculo.marca,
                      modelo: vehiculo.modelo,
                      estado: vehiculo.estado,
                      lat: vehiculo.ubicacionLat,
                      lng: vehiculo.ubicacionLng,
                      actualizada: vehiculo.ubicacionActualizada!.toISOString(),
                    },
                  ]
                : []
            }
            height={260}
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gastos del vehículo</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/gastos/nuevo?vehiculoId=${vehiculo.id}`}><Plus className="h-3.5 w-3.5" /> Nuevo gasto</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total registrado</span>
              <span className="font-semibold tabular-nums">{formatCurrency(gastoTotal)}</span>
            </div>
            {vehiculo.gastos.length === 0 ? (
              <EmptyState title="Sin gastos" description="Todavía no hay gastos registrados para este vehículo." />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {vehiculo.gastos.map((g) => (
                  <li key={g.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{categoriaGastoLabel(g.categoria)}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(g.fecha)} {g.proveedor ? `· ${g.proveedor.nombre}` : ""}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(g.importe)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Combustible</CardTitle>
            <div className="flex items-center gap-2">
              <QuickScanButton vehiculoId={vehiculo.id} size="sm" />
              <Button asChild size="sm" variant="outline">
                <Link href={`/combustible/nuevo?vehiculoId=${vehiculo.id}`}><Plus className="h-3.5 w-3.5" /> Registrar carga</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total · {litrosTotal.toFixed(0)} L</span>
              <span className="font-semibold tabular-nums">{formatCurrency(combustibleTotal)}</span>
            </div>
            {vehiculo.cargas.length === 0 ? (
              <EmptyState title="Sin cargas" description="Todavía no hay cargas de combustible registradas." icon={<Fuel className="h-6 w-6" />} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {vehiculo.cargas.map((c) => (
                  <li key={c.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.litros.toFixed(0)} L {c.estacion ? `· ${c.estacion}` : ""}</p>
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

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Traslados recientes</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/logistica/nuevo?vehiculoId=${vehiculo.id}`}><Plus className="h-3.5 w-3.5" /> Nuevo traslado</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {vehiculo.traslados.length === 0 ? (
            <EmptyState title="Sin traslados" description="Este vehículo todavía no tiene traslados registrados." icon={<RouteIcon className="h-6 w-6" />} />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {vehiculo.traslados.map((t) => (
                <li key={t.id}>
                  <Link href={`/logistica/${t.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-sm font-medium">{t.origen} → {t.destino}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatDate(t.fecha)} {t.conductor ? `· ${t.conductor.nombre} ${t.conductor.apellido}` : ""}
                      </p>
                    </div>
                    <StatusBadge estado={t.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {vehiculo.impuestos.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Impuestos</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/impuestos/nuevo`}><Plus className="h-3.5 w-3.5" /> Nuevo impuesto</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--border)]">
              {vehiculo.impuestos.map((i) => (
                <li key={i.id}>
                  <Link href={`/impuestos/${i.id}/editar`} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-sm font-medium">{i.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatCurrency(i.importe)} · Vence {formatDate(i.vencimiento)}</p>
                    </div>
                    {i.estado === "PAGADO" ? <StatusBadge estado="PAGADO" /> : <ExpiryBadge dias={diasHasta(i.vencimiento)} />}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {vehiculo.documentos.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documentación adicional</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/documentacion/nuevo?vehiculoId=${vehiculo.id}`}><Plus className="h-3.5 w-3.5" /> Agregar documento</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--border)]">
              {vehiculo.documentos.map((d) => (
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

function VencimientoRow({ label, fecha }: { label: string; fecha: Date | null }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{formatDate(fecha)}</p>
      </div>
      <ExpiryBadge dias={diasHasta(fecha)} />
    </div>
  );
}
