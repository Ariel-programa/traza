import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VehiculosMap } from "@/components/ui/vehiculos-map";
import { formatRelativo } from "@/lib/format";
import { MapPin, Truck } from "lucide-react";

export default async function MonitoreoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const vehiculos = await prisma.vehiculo.findMany({
    where: empresaWhere(session),
    orderBy: { patente: "asc" },
  });

  const conUbicacion = vehiculos.filter((v) => v.ubicacionLat != null && v.ubicacionLng != null);
  const sinUbicacion = vehiculos.filter((v) => v.ubicacionLat == null || v.ubicacionLng == null);
  const masReciente = conUbicacion
    .slice()
    .sort((a, b) => b.ubicacionActualizada!.getTime() - a.ubicacionActualizada!.getTime())[0];

  return (
    <div>
      <PageHeader
        title="Monitoreo"
        description="Última ubicación conocida de cada vehículo. TRAZA no tiene GPS instalado en la flota: la posición se carga a mano desde 'Actualizar ubicación' en la ficha de cada vehículo."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <StatCard label="Vehículos" value={vehiculos.length} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Con ubicación" value={conUbicacion.length} icon={<MapPin className="h-4 w-4" />} />
        <StatCard label="Sin ubicación" value={sinUbicacion.length} tone={sinUbicacion.length > 0 ? "danger" : "neutral"} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <VehiculosMap
            vehiculos={conUbicacion.map((v) => ({
              id: v.id,
              patente: v.patente,
              marca: v.marca,
              modelo: v.modelo,
              estado: v.estado,
              lat: v.ubicacionLat!,
              lng: v.ubicacionLng!,
              actualizada: v.ubicacionActualizada!.toISOString(),
            }))}
            height={420}
          />
        </CardContent>
      </Card>

      {sinUbicacion.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <p className="text-sm font-medium">Sin ubicación cargada</p>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {sinUbicacion.map((v) => (
                <li key={v.id}>
                  <Link href={`/flota/${v.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-sm font-medium">{v.patente}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{v.marca} {v.modelo}</p>
                    </div>
                    <StatusBadge estado={v.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {vehiculos.length === 0 && (
        <EmptyState title="Sin vehículos" description="Todavía no hay vehículos cargados en la flota." icon={<Truck className="h-6 w-6" />} />
      )}

      {masReciente && (
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Actualización más reciente: {formatRelativo(masReciente.ubicacionActualizada!)} ({masReciente.patente}).
        </p>
      )}
    </div>
  );
}
