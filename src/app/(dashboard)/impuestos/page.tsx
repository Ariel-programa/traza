import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Landmark, AlertCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ImpuestosTable } from "./impuestos-table";

export default async function ImpuestosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const where = empresaWhere(session);

  const impuestos = await prisma.impuesto.findMany({
    where,
    include: { vehiculo: true, activo: true },
    orderBy: { vencimiento: "asc" },
  });

  const pendientes = impuestos.filter((i) => i.estado !== "PAGADO");
  const vencidos = impuestos.filter((i) => i.estado === "VENCIDO");
  const totalPendiente = pendientes.reduce((s, i) => s + i.importe, 0);

  return (
    <div>
      <PageHeader
        title="Impuestos"
        description="Patentes, ingresos brutos, monotributo y demás obligaciones fiscales de la empresa y su flota."
        actions={
          <Button asChild>
            <Link href="/impuestos/nuevo"><Plus className="h-4 w-4" /> Nuevo impuesto</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-2xl">
        <StatCard label="Total pendiente" value={formatCurrency(totalPendiente)} icon={<Landmark className="h-4 w-4" />} />
        <StatCard
          label="Vencidos"
          value={vencidos.length}
          tone={vencidos.length > 0 ? "danger" : "neutral"}
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard label="Pendientes" value={pendientes.length} icon={<Clock className="h-4 w-4" />} />
      </div>
      <ImpuestosTable data={impuestos} />
    </div>
  );
}
