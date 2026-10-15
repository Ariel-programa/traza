import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConductorForm } from "../../conductor-form";
import { updateConductor } from "../../../actions";

export default async function EditarConductorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const conductor = await prisma.conductor.findUnique({ where: { id } });
  if (!conductor) notFound();
  if (session.rol !== "ADMIN" && conductor.empresaId !== session.empresaId) notFound();

  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title={`Editar ${conductor.nombre} ${conductor.apellido}`} />
      <Card>
        <CardContent className="pt-5">
          <ConductorForm
            action={updateConductor.bind(null, id)}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            submitLabel="Guardar cambios"
            defaultValues={{
              nombre: conductor.nombre,
              apellido: conductor.apellido,
              documento: conductor.documento ?? undefined,
              telefono: conductor.telefono ?? undefined,
              licencia: conductor.licencia ?? undefined,
              licenciaVencimiento: conductor.licenciaVencimiento?.toISOString().slice(0, 10),
              estado: conductor.estado,
              empresaId: conductor.empresaId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
