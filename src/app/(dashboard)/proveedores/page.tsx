import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProveedoresTable } from "./proveedores-table";

export default async function ProveedoresPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const proveedores = await prisma.proveedor.findMany({
    where: empresaWhere(session),
    include: { empresa: true, _count: { select: { activos: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description="Empresas y personas que brindan servicios de mantenimiento, transporte, combustible y más."
        actions={
          <Button asChild>
            <Link href="/proveedores/nuevo"><Plus className="h-4 w-4" /> Nuevo proveedor</Link>
          </Button>
        }
      />
      <ProveedoresTable data={proveedores} showEmpresa={session.rol === "ADMIN"} />
    </div>
  );
}
