import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { tipoActivoLabel } from "@/lib/format";
import { Search } from "lucide-react";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const where = empresaWhere(session);

  const results = query.length >= 2
    ? await Promise.all([
        prisma.activo.findMany({
          where: {
            ...where,
            OR: [
              { codigo: { contains: query, mode: "insensitive" } },
              { nombre: { contains: query, mode: "insensitive" } },
              { numeroSerie: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 15,
        }),
        prisma.proveedor.findMany({ where: { ...where, nombre: { contains: query, mode: "insensitive" } }, take: 10 }),
        prisma.vehiculo.findMany({
          where: { ...where, OR: [{ patente: { contains: query, mode: "insensitive" } }, { marca: { contains: query, mode: "insensitive" } }] },
          take: 10,
        }),
        prisma.conductor.findMany({
          where: { ...where, OR: [{ nombre: { contains: query, mode: "insensitive" } }, { apellido: { contains: query, mode: "insensitive" } }] },
          take: 10,
        }),
        prisma.traslado.findMany({
          where: {
            ...where,
            OR: [
              { numero: { contains: query, mode: "insensitive" } },
              { origen: { contains: query, mode: "insensitive" } },
              { destino: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
        }),
      ])
    : [[], [], [], [], []];

  const [activos, proveedores, vehiculos, conductores, traslados] = results;
  const totalResultados = activos.length + proveedores.length + vehiculos.length + conductores.length + traslados.length;

  return (
    <div>
      <PageHeader title="Búsqueda" description="Buscá activos, proveedores, vehículos, conductores y traslados en toda la plataforma." />

      <form className="mb-6 max-w-lg" action="/buscar">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input name="q" defaultValue={query} placeholder="Buscar por código, nombre, patente..." autoFocus className="pl-9 h-10" />
        </div>
      </form>

      {query.length < 2 ? (
        <EmptyState title="Escribí al menos 2 caracteres" description="Podés buscar por código de activo, nombre, patente de vehículo o número de traslado." />
      ) : totalResultados === 0 ? (
        <EmptyState title="Sin resultados" description={`No encontramos nada que coincida con "${query}".`} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {activos.length > 0 && (
            <ResultCard title={`Activos (${activos.length})`}>
              {activos.map((a) => (
                <ResultRow key={a.id} href={`/activos/${a.id}`} title={`${a.codigo} · ${a.nombre}`} subtitle={tipoActivoLabel(a.tipo)} badge={<StatusBadge estado={a.estado} />} />
              ))}
            </ResultCard>
          )}
          {proveedores.length > 0 && (
            <ResultCard title={`Proveedores (${proveedores.length})`}>
              {proveedores.map((p) => (
                <ResultRow key={p.id} href={`/proveedores/${p.id}`} title={p.nombre} subtitle={p.servicio} />
              ))}
            </ResultCard>
          )}
          {vehiculos.length > 0 && (
            <ResultCard title={`Vehículos (${vehiculos.length})`}>
              {vehiculos.map((v) => (
                <ResultRow key={v.id} href="/flota" title={`${v.patente} · ${v.marca} ${v.modelo}`} subtitle={v.tipo} />
              ))}
            </ResultCard>
          )}
          {conductores.length > 0 && (
            <ResultCard title={`Conductores (${conductores.length})`}>
              {conductores.map((c) => (
                <ResultRow key={c.id} href="/flota/conductores" title={`${c.nombre} ${c.apellido}`} subtitle={c.licencia ?? undefined} />
              ))}
            </ResultCard>
          )}
          {traslados.length > 0 && (
            <ResultCard title={`Traslados (${traslados.length})`}>
              {traslados.map((t) => (
                <ResultRow key={t.id} href={`/logistica/${t.id}`} title={t.numero} subtitle={`${t.origen} → ${t.destino}`} badge={<StatusBadge estado={t.estado} />} />
              ))}
            </ResultCard>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--border)]">{children}</ul>
      </CardContent>
    </Card>
  );
}

function ResultRow({ href, title, subtitle, badge }: { href: string; title: string; subtitle?: string; badge?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between px-5 py-2.5 hover:bg-[var(--surface-hover)]">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          {subtitle && <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>}
        </div>
        {badge && <div className="shrink-0 ml-3">{badge}</div>}
      </Link>
    </li>
  );
}
