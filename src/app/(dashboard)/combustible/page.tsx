import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Fuel } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { CombustibleTable } from "./combustible-table";
import { QuickScanButton } from "./quick-scan-button";

export default async function CombustiblePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cargas = await prisma.combustibleCarga.findMany({
    where: { vehiculo: empresaWhere(session) },
    include: { vehiculo: true, conductor: true },
    orderBy: { fecha: "desc" },
  });

  const totalImporte = cargas.reduce((s, c) => s + c.importe, 0);
  const totalLitros = cargas.reduce((s, c) => s + c.litros, 0);
  const costoPromedio = totalLitros > 0 ? totalImporte / totalLitros : 0;

  return (
    <div>
      <PageHeader
        title="Combustible"
        description="Cargas de combustible de la flota y su costo."
        actions={
          <>
            <QuickScanButton />
            <Button asChild>
              <Link href="/combustible/nuevo"><Plus className="h-4 w-4" /> Registrar carga</Link>
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <StatCard label="Gasto total" value={formatCurrency(totalImporte)} icon={<Fuel className="h-4 w-4" />} />
        <StatCard label="Litros cargados" value={`${totalLitros.toFixed(0)} L`} />
        <StatCard label="Costo promedio/L" value={formatCurrency(costoPromedio)} />
      </div>
      <CombustibleTable data={cargas} />
    </div>
  );
}
