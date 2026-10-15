import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ActivoForm } from "../activo-form";
import { createActivo } from "../actions";

export default async function NuevoActivoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const options = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nuevo activo" description="Registrá un nuevo activo de la empresa." />
      <Card>
        <CardContent className="pt-5">
          <ActivoForm
            action={createActivo}
            options={options}
            submitLabel="Crear activo"
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
