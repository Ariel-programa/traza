import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { VehiculoForm } from "../../vehiculo-form";
import { updateVehiculo } from "../../actions";

export default async function EditarVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id } });
  if (!vehiculo) notFound();
  if (session.rol !== "ADMIN" && vehiculo.empresaId !== session.empresaId) notFound();

  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title={`Editar ${vehiculo.patente}`} />
      <Card>
        <CardContent className="pt-5">
          <VehiculoForm
            action={updateVehiculo.bind(null, id)}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            submitLabel="Guardar cambios"
            isEdit
            defaultValues={{
              patente: vehiculo.patente,
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
              anio: vehiculo.anio?.toString(),
              tipo: vehiculo.tipo,
              kilometraje: vehiculo.kilometraje.toString(),
              estado: vehiculo.estado,
              serviceProximo: vehiculo.serviceProximo?.toISOString().slice(0, 10),
              vtvVencimiento: vehiculo.vtvVencimiento?.toISOString().slice(0, 10),
              seguroVencimiento: vehiculo.seguroVencimiento?.toISOString().slice(0, 10),
              empresaId: vehiculo.empresaId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
