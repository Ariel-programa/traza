import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { StatCard } from "@/components/ui/stat-card";
import { diasHasta } from "@/lib/vencimientos";
import { Plus, Users2, Truck, AlertTriangle, Wrench } from "lucide-react";
import { VehiculosTable } from "./vehiculos-table";

export default async function FlotaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { error } = await searchParams;

  const vehiculos = await prisma.vehiculo.findMany({
    where: empresaWhere(session),
    include: { empresa: true },
    orderBy: { patente: "asc" },
  });

  const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE").length;
  const conVencimientoUrgente = vehiculos.filter((v) => {
    const dias = [v.vtvVencimiento, v.seguroVencimiento].map(diasHasta).filter((d): d is number => d !== null);
    return dias.some((d) => d <= 7);
  }).length;
  const conServicePendiente = vehiculos.filter((v) => {
    const dias = diasHasta(v.serviceProximo);
    return dias !== null && dias <= 30;
  }).length;

  return (
    <div>
      <PageHeader
        title="Flota"
        description="Vehículos de la empresa: estado, documentación y mantenimiento."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/flota/conductores"><Users2 className="h-4 w-4" /> Conductores</Link>
            </Button>
            <Button asChild>
              <Link href="/flota/nuevo"><Plus className="h-4 w-4" /> Nuevo vehículo</Link>
            </Button>
          </>
        }
      />
      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este vehículo porque tiene cargas de combustible registradas. Para conservar la trazabilidad,
          primero tendrías que eliminar ese historial.
        </ErrorBanner>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <StatCard label="Vehículos" value={vehiculos.length} icon={<Truck className="h-4 w-4" />} />
        <StatCard
          label="VTV/seguro urgente"
          value={conVencimientoUrgente}
          tone={conVencimientoUrgente > 0 ? "danger" : "neutral"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard label="Service próximo" value={conServicePendiente} icon={<Wrench className="h-4 w-4" />} />
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3">{disponibles} de {vehiculos.length} disponibles ahora.</p>
      <VehiculosTable data={vehiculos} showEmpresa={session.rol === "ADMIN"} />
    </div>
  );
}
