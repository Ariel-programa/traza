import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Plus, Wallet } from "lucide-react";
import { formatCurrency, categoriaGastoLabel } from "@/lib/format";
import { GastosTable } from "./gastos-table";

export default async function GastosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const where = empresaWhere(session);

  const gastos = await prisma.gasto.findMany({
    where,
    include: { proveedor: true, activo: true, vehiculo: true, traslado: true },
    orderBy: { fecha: "desc" },
  });

  const total = gastos.reduce((s, g) => s + g.importe, 0);
  const porCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.importe;
    return acc;
  }, {});
  const categoriaTop = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <PageHeader
        title="Gastos"
        description="Todos los gastos de la operación: combustible, peajes, mantenimiento y más."
        actions={
          <Button asChild>
            <Link href="/gastos/nuevo"><Plus className="h-4 w-4" /> Nuevo gasto</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
        <StatCard label="Gasto total" value={formatCurrency(total)} icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Categoría principal" value={categoriaTop ? categoriaGastoLabel(categoriaTop[0]) : "—"} hint={categoriaTop ? formatCurrency(categoriaTop[1]) : undefined} />
      </div>
      <GastosTable data={gastos} puedeEliminar={puedeEliminar(session.rol)} />
    </div>
  );
}
