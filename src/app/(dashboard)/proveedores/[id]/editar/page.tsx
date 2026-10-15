import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProveedorForm } from "../../proveedor-form";
import { updateProveedor } from "../../actions";

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) notFound();
  if (session.rol !== "ADMIN" && proveedor.empresaId !== session.empresaId) notFound();

  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title={`Editar ${proveedor.nombre}`} />
      <Card>
        <CardContent className="pt-5">
          <ProveedorForm
            action={updateProveedor.bind(null, id)}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            submitLabel="Guardar cambios"
            defaultValues={{
              nombre: proveedor.nombre,
              cuit: proveedor.cuit ?? undefined,
              contacto: proveedor.contacto ?? undefined,
              telefono: proveedor.telefono ?? undefined,
              email: proveedor.email ?? undefined,
              servicio: proveedor.servicio,
              estado: proveedor.estado,
              observaciones: proveedor.observaciones ?? undefined,
              empresaId: proveedor.empresaId,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
