import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComodatoForm } from "../comodato-form";

export default async function NuevoComodatoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const activos = await prisma.activo.findMany({
    where: { ...empresaWhere(session), comodato: null },
    orderBy: { codigo: "asc" },
    select: { id: true, codigo: true, nombre: true },
  });

  return (
    <div>
      <PageHeader title="Nuevo comodato" description="Registrá un activo cedido en comodato a un cliente." />
      <Card>
        <CardContent className="pt-5">
          <ComodatoForm activos={activos} />
        </CardContent>
      </Card>
    </div>
  );
}
