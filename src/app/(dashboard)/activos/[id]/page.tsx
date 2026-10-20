import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatDate, tipoActivoLabel, tipoMantenimientoLabel } from "@/lib/format";
import { Pencil, Plus, ExternalLink, Printer } from "lucide-react";
import { deleteActivo } from "../actions";

export default async function ActivoDetailPage({
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

  const activo = await prisma.activo.findUnique({
    where: { id },
    include: {
      empresa: true,
      ubicacion: true,
      proveedor: true,
      comodato: true,
      mantenimientos: { include: { tecnico: true, proveedor: true }, orderBy: { fecha: "desc" } },
      documentos: { orderBy: { vencimiento: "asc" } },
    },
  });

  if (!activo) notFound();
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) notFound();

  const atributos = activo.atributos ? (JSON.parse(activo.atributos) as Record<string, unknown>) : null;

  return (
    <div>
      <PageHeader
        title={`${activo.codigo} · ${activo.nombre}`}
        description={tipoActivoLabel(activo.tipo)}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/mantenimiento/nuevo?activoId=${activo.id}`}><Plus className="h-3.5 w-3.5" /> Mantenimiento</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/activos/${activo.id}/editar`}><Pencil className="h-3.5 w-3.5" /> Editar</Link>
            </Button>
            {puedeEliminar(session.rol) && (
              <DeleteButton action={deleteActivo.bind(null, activo.id)} confirmMessage={`¿Eliminar el activo ${activo.codigo}? Esta acción no se puede deshacer.`} />
            )}
          </>
        }
      />

      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este activo porque tiene mantenimientos o un comodato registrado. Para conservar la trazabilidad,
          primero tendrías que eliminar ese historial.
        </ErrorBanner>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información general</CardTitle>
            <StatusBadge estado={activo.estado} />
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Empresa" value={activo.empresa.nombre} />
              <Info label="Ubicación" value={activo.ubicacion?.nombre ?? "—"} />
              <Info label="Marca / Modelo" value={`${activo.marca ?? "—"} ${activo.modelo ?? ""}`} />
              <Info label="Número de serie" value={activo.numeroSerie ?? "—"} />
              <Info
                label="Proveedor"
                value={
                  activo.proveedor ? (
                    <Link href={`/proveedores/${activo.proveedor.id}`} className="hover:text-[var(--brand-hover)] underline-offset-2 hover:underline">
                      {activo.proveedor.nombre}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Info label="Modalidad" value={<StatusBadge estado={activo.modalidad} />} />
              <Info label="Fecha de alta" value={formatDate(activo.fechaAlta)} />
              <Info label="Fecha de adquisición" value={formatDate(activo.fechaAdquisicion)} />
              <Info label="Última inspección" value={formatDate(activo.ultimaInspeccion)} />
              <Info
                label={activo.tipo === "EQUIPO_MEDICO" ? "Próxima calibración" : "Próximo vencimiento"}
                value={formatDate(activo.proximoVencimiento)}
              />
              {atributos && Object.entries(atributos).map(([k, v]) => v ? <Info key={k} label={k} value={String(v)} /> : null)}
            </dl>
            {activo.observaciones && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">Observaciones</p>
                <p className="text-sm text-[var(--text-primary)]">{activo.observaciones}</p>
              </div>
            )}
            {activo.comodato && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">Comodato</p>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <Info label="Propietario" value={activo.comodato.propietario} />
                  <Info label="Cliente" value={activo.comodato.cliente} />
                  <Info label="Vigencia" value={`${formatDate(activo.comodato.fechaInicio)} — ${formatDate(activo.comodato.fechaFinal)}`} />
                  <Info label="Estado" value={activo.comodato.estado} />
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Código QR</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-3 bg-white">
              <Image src={`/api/qr/${activo.qrSlug}`} alt={`QR ${activo.codigo}`} width={180} height={180} unoptimized />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">Escaneá para ver la ficha pública del activo.</p>
            <div className="flex gap-2 mt-3 w-full">
              <Button asChild variant="secondary" size="sm" className="flex-1">
                <Link href={`/public/activo/${activo.qrSlug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Ver ficha</Link>
              </Button>
              <Button asChild variant="secondary" size="sm" className="flex-1">
                <Link href={`/qr/${activo.id}/imprimir`}><Printer className="h-3.5 w-3.5" /> Imprimir</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial de mantenimiento</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/mantenimiento/nuevo?activoId=${activo.id}`}><Plus className="h-3.5 w-3.5" /> Registrar</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {activo.mantenimientos.length === 0 ? (
            <EmptyState title="Sin mantenimientos" description="Todavía no se registraron intervenciones para este activo." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {activo.mantenimientos.map((m) => (
                <li key={m.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tipoMantenimientoLabel(m.tipo)}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDate(m.fecha)} · {m.tecnico ? `${m.tecnico.nombre} ${m.tecnico.apellido}` : m.proveedor?.nombre ?? "—"}
                      {m.resultado ? ` · ${m.resultado}` : ""}
                    </p>
                  </div>
                  {m.proximaFecha && <span className="text-xs text-[var(--text-muted)]">Próxima: {formatDate(m.proximaFecha)}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documentación</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/documentacion/nuevo?activoId=${activo.id}`}><Plus className="h-3.5 w-3.5" /> Agregar documento</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {activo.documentos.length === 0 ? (
            <EmptyState title="Sin documentos" description="Todavía no hay documentación cargada para este activo." />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {activo.documentos.map((d) => (
                <li key={d.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{d.tipo}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.numero ?? "—"} · Vence {formatDate(d.vencimiento)}</p>
                  </div>
                  <StatusBadge estado={d.estado} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
