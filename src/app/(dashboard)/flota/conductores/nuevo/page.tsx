import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ConductorForm } from "../conductor-form";
import { createConductor } from "../../actions";

export default async function NuevoConductorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nuevo conductor" description="Registrá un conductor de la flota." />
      <Card>
        <CardContent className="pt-5">
          <ConductorForm
            action={createConductor}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
