import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { VehiculoForm } from "../vehiculo-form";
import { createVehiculo } from "../actions";

export default async function NuevoVehiculoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nuevo vehículo" description="Registrá un vehículo de la flota." />
      <Card>
        <CardContent className="pt-5">
          <VehiculoForm
            action={createVehiculo}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            submitLabel="Crear vehículo"
          />
        </CardContent>
      </Card>
    </div>
  );
}
