import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MantenimientosTable } from "./mantenimientos-table";

export default async function MantenimientoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const mantenimientos = await prisma.mantenimiento.findMany({
    where: { activo: empresaWhere(session) },
    include: { activo: true, proveedor: true, tecnico: true },
    orderBy: { fecha: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Mantenimiento"
        description="Historial de inspecciones, recargas, reparaciones y calibraciones de todos los activos."
        actions={
          <Button asChild>
            <Link href="/mantenimiento/nuevo"><Plus className="h-4 w-4" /> Registrar mantenimiento</Link>
          </Button>
        }
      />
      <MantenimientosTable data={mantenimientos} />
    </div>
  );
}
