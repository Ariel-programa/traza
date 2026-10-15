import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ImpuestoForm } from "../impuesto-form";

export default async function NuevoImpuestoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [{ empresas, vehiculos }, activos] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Nuevo impuesto" description="Registrá un impuesto o tasa para hacerle seguimiento a su vencimiento." />
      <Card>
        <CardContent className="pt-5">
          <ImpuestoForm
            options={{ empresas, vehiculos, activos }}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
