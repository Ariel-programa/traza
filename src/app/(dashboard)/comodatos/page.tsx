import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComodatosTable } from "./comodatos-table";

export default async function ComodatosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const comodatos = await prisma.comodato.findMany({
    where: { activo: empresaWhere(session) },
    include: { activo: true },
    orderBy: { fechaInicio: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Comodatos"
        description="Activos propios cedidos a clientes o recibidos de proveedores bajo modalidad de comodato."
        actions={
          <Button asChild>
            <Link href="/comodatos/nuevo"><Plus className="h-4 w-4" /> Nuevo comodato</Link>
          </Button>
        }
      />
      <ComodatosTable data={comodatos} puedeEliminar={puedeEliminar(session.rol)} />
    </div>
  );
}
