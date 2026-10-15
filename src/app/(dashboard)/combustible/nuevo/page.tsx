import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CombustibleForm } from "../combustible-form";

export default async function NuevaCargaPage({
  searchParams,
}: {
  searchParams: Promise<{ vehiculoId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { vehiculoId } = await searchParams;
  const { vehiculos, conductores } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Registrar carga de combustible" />
      <Card>
        <CardContent className="pt-5">
          <CombustibleForm options={{ vehiculos, conductores }} vehiculoIdPreseleccionado={vehiculoId} />
        </CardContent>
      </Card>
    </div>
  );
}
