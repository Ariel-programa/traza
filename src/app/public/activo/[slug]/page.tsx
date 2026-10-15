import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, tipoActivoLabel } from "@/lib/format";
import { Flame, HeartPulse, Package, MapPin, Wrench, Calendar, Building2 } from "lucide-react";
import type { TipoActivo } from "@prisma/client";

const ICONS: Partial<Record<TipoActivo, React.ComponentType<{ className?: string }>>> = {
  MATAFUEGO: Flame,
  EQUIPO_MEDICO: HeartPulse,
};

export default async function PublicActivoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const activo = await prisma.activo.findUnique({
    where: { qrSlug: slug },
    include: { empresa: true, ubicacion: true, proveedor: true, mantenimientos: { orderBy: { fecha: "desc" }, take: 1 } },
  });

  if (!activo) notFound();

  const Icon = ICONS[activo.tipo] ?? Package;
  const atributos = activo.atributos ? (JSON.parse(activo.atributos) as Record<string, unknown>) : null;
  const ultimoMantenimiento = activo.mantenimientos[0];

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] flex flex-col items-center px-4 py-8">
      <Logo className="mb-6" />

      <div className="w-full max-w-sm bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="bg-[#0f1522] text-white px-5 py-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-3">
            <Icon className="h-6 w-6" />
          </span>
          <p className="text-xs uppercase tracking-wide text-white/60">{tipoActivoLabel(activo.tipo)}</p>
          <h1 className="text-lg font-semibold mt-0.5">{activo.nombre}</h1>
          <p className="text-sm text-white/70 font-mono mt-1">{activo.codigo}</p>
          <div className="mt-3">
            <StatusBadge estado={activo.estado} />
          </div>
        </div>

        <div className="p-5 space-y-4">
          {atributos && Object.keys(atributos).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(atributos).map(([k, v]) =>
                v ? (
                  <div key={k} className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{k}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{String(v)}</p>
                  </div>
                ) : null
              )}
            </div>
          )}

          <Row icon={<Building2 className="h-4 w-4" />} label="Empresa" value={activo.empresa.nombre} />
          {activo.ubicacion && <Row icon={<MapPin className="h-4 w-4" />} label="Ubicación" value={activo.ubicacion.nombre} />}
          <Row icon={<Calendar className="h-4 w-4" />} label="Última inspección" value={formatDate(activo.ultimaInspeccion)} />
          <Row icon={<Calendar className="h-4 w-4" />} label="Próximo vencimiento" value={formatDate(activo.proximoVencimiento)} />
          {ultimoMantenimiento && (
            <Row icon={<Wrench className="h-4 w-4" />} label="Último mantenimiento" value={formatDate(ultimoMantenimiento.fecha)} />
          )}
          {activo.proveedor && <Row icon={<Building2 className="h-4 w-4" />} label="Proveedor" value={activo.proveedor.nombre} />}
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-6 text-center max-w-xs">
        Esta información es pública y solo muestra el estado del activo. Generado por TRAZA.
      </p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
