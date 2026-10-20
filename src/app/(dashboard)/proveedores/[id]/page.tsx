import Link from "next/link";
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
import { formatDate, formatCurrency, tipoActivoLabel, categoriaGastoLabel } from "@/lib/format";
import { Pencil } from "lucide-react";
import { deleteProveedor } from "../actions";

export default async function ProveedorDetailPage({
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

  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      empresa: true,
      activos: { orderBy: { codigo: "asc" } },
      mantenimientos: { include: { activo: true }, orderBy: { fecha: "desc" }, take: 10 },
      gastos: { orderBy: { fecha: "desc" }, take: 10 },
    },
  });

  if (!proveedor) notFound();
  if (session.rol !== "ADMIN" && proveedor.empresaId !== session.empresaId) notFound();

  const gastoTotal = await prisma.gasto.aggregate({ where: { proveedorId: id }, _sum: { importe: true } });

  return (
    <div>
      <PageHeader
        title={proveedor.nombre}
        description={proveedor.servicio}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/proveedores/${id}/editar`}><Pencil className="h-3.5 w-3.5" /> Editar</Link>
            </Button>
            {puedeEliminar(session.rol) && (
              <DeleteButton action={deleteProveedor.bind(null, id)} confirmMessage={`¿Eliminar al proveedor ${proveedor.nombre}?`} />
            )}
          </>
        }
      />

      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este proveedor porque tiene activos, mantenimientos, gastos, documentos o usuarios asociados.
          Para conservar la trazabilidad, primero tendrías que desvincular ese historial.
        </ErrorBanner>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información de contacto</CardTitle>
            <StatusBadge estado={proveedor.estado} />
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Info label="Empresa" value={proveedor.empresa.nombre} />
              <Info label="CUIT" value={proveedor.cuit ?? "—"} />
              <Info label="Contacto" value={proveedor.contacto ?? "—"} />
              <Info label="Teléfono" value={proveedor.telefono ?? "—"} />
              <Info label="Email" value={proveedor.email ?? "—"} />
              <Info label="Servicio" value={proveedor.servicio} />
            </dl>
            {proveedor.observaciones && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">Observaciones</p>
                <p className="text-sm">{proveedor.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Activos asignados</span><span className="font-medium">{proveedor.activos.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Mantenimientos realizados</span><span className="font-medium">{proveedor.mantenimientos.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">Gasto total</span><span className="font-medium">{formatCurrency(gastoTotal._sum.importe ?? 0)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Activos asignados</CardTitle></CardHeader>
        <CardContent className="p-0">
          {proveedor.activos.length === 0 ? (
            <EmptyState title="Sin activos asignados" />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {proveedor.activos.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <Link href={`/activos/${a.id}`} className="text-sm font-medium hover:text-[var(--brand)]">{a.codigo} · {a.nombre}</Link>
                  <span className="text-xs text-[var(--text-muted)]">{tipoActivoLabel(a.tipo)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Mantenimientos recientes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {proveedor.mantenimientos.length === 0 ? (
            <EmptyState title="Sin mantenimientos registrados" />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {proveedor.mantenimientos.map((m) => (
                <li key={m.id} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm">{m.activo.codigo} · {m.activo.nombre}</span>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(m.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Gastos recientes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {proveedor.gastos.length === 0 ? (
            <EmptyState title="Sin gastos registrados" />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {proveedor.gastos.map((g) => (
                <li key={g.id} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm">{categoriaGastoLabel(g.categoria)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(g.fecha)}</span>
                    <span className="text-sm font-medium">{formatCurrency(g.importe)}</span>
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

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="text-[var(--text-primary)] font-medium">{value}</dd>
    </div>
  );
}
