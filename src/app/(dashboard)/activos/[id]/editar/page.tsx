import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ActivoForm } from "../../activo-form";
import { updateActivo } from "../../actions";

export default async function EditarActivoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const activo = await prisma.activo.findUnique({ where: { id } });
  if (!activo) notFound();
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) notFound();

  const options = await getFormOptions(session);
  const atributos = activo.atributos ? (JSON.parse(activo.atributos) as Record<string, string>) : {};
  const boundAction = updateActivo.bind(null, id);

  return (
    <div>
      <PageHeader title={`Editar ${activo.codigo}`} description={activo.nombre} />
      <Card>
        <CardContent className="pt-5">
          <ActivoForm
            action={boundAction}
            options={options}
            submitLabel="Guardar cambios"
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            defaultValues={{
              tipo: activo.tipo,
              nombre: activo.nombre,
              marca: activo.marca ?? undefined,
              modelo: activo.modelo ?? undefined,
              numeroSerie: activo.numeroSerie ?? undefined,
              empresaId: activo.empresaId,
              ubicacionId: activo.ubicacionId ?? undefined,
              proveedorId: activo.proveedorId ?? undefined,
              modalidad: activo.modalidad,
              fechaAdquisicion: activo.fechaAdquisicion?.toISOString().slice(0, 10),
              ultimaInspeccion: activo.ultimaInspeccion?.toISOString().slice(0, 10),
              proximoVencimiento: activo.proximoVencimiento?.toISOString().slice(0, 10),
              observaciones: activo.observaciones ?? undefined,
              tipoMatafuego: atributos.tipoMatafuego,
              capacidadKg: atributos.capacidadKg ? String(atributos.capacidadKg) : undefined,
              subtipoMedico: atributos.subtipo,
              responsableMedico: atributos.responsable,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
