import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MantenimientoForm } from "../mantenimiento-form";

export default async function NuevoMantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ activoId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { activoId } = await searchParams;

  const [{ proveedores, tecnicos }, activos] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Registrar mantenimiento" description="Dejá constancia de una inspección, recarga, reparación o calibración." />
      <Card>
        <CardContent className="pt-5">
          <MantenimientoForm options={{ activos, proveedores, tecnicos }} activoIdPreseleccionado={activoId} />
        </CardContent>
      </Card>
    </div>
  );
}
