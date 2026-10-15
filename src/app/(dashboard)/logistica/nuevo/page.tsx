import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrasladoForm } from "../traslado-form";

export default async function NuevoTrasladoPage({
  searchParams,
}: {
  searchParams: Promise<{ vehiculoId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { vehiculoId } = await searchParams;
  const { empresas, vehiculos, conductores } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nuevo traslado" description="Planificá un traslado de mercadería o pasajeros." />
      <Card>
        <CardContent className="pt-5">
          <TrasladoForm
            options={{ empresas, vehiculos, conductores }}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            vehiculoIdPreseleccionado={vehiculoId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
