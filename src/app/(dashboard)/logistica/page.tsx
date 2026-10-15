import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TrasladosTable } from "./traslados-table";

export default async function LogisticaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const traslados = await prisma.traslado.findMany({
    where: empresaWhere(session),
    include: { vehiculo: true, conductor: true },
    orderBy: { fecha: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Logística"
        description="Traslados planificados, en curso y completados."
        actions={
          <Button asChild>
            <Link href="/logistica/nuevo"><Plus className="h-4 w-4" /> Nuevo traslado</Link>
          </Button>
        }
      />
      <TrasladosTable data={traslados} />
    </div>
  );
}
