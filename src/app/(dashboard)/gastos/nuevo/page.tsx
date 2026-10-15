import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { GastoForm } from "../gasto-form";

export default async function NuevoGastoPage({
  searchParams,
}: {
  searchParams: Promise<{ trasladoId?: string; vehiculoId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { trasladoId, vehiculoId } = await searchParams;

  const [{ empresas, proveedores, vehiculos }, activos, traslados] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
    prisma.traslado.findMany({ where: empresaWhere(session), orderBy: { numero: "desc" }, select: { id: true, numero: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Nuevo gasto" description="Registrá un gasto de la operación." />
      <Card>
        <CardContent className="pt-5">
          <GastoForm
            options={{ empresas, proveedores, activos, vehiculos, traslados }}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            trasladoIdPreseleccionado={trasladoId}
            vehiculoIdPreseleccionado={vehiculoId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
