import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentoForm } from "../documento-form";

export default async function NuevoDocumentoPage({
  searchParams,
}: {
  searchParams: Promise<{ activoId?: string; vehiculoId?: string; conductorId?: string; proveedorId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;

  const [{ empresas, proveedores, vehiculos, conductores }, activos] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
  ]);

  let preseleccion: { entidadTipo?: string; entidadId?: string } | undefined;
  if (params.activoId) preseleccion = { entidadTipo: "ACTIVO", entidadId: params.activoId };
  else if (params.vehiculoId) preseleccion = { entidadTipo: "VEHICULO", entidadId: params.vehiculoId };
  else if (params.conductorId) preseleccion = { entidadTipo: "CONDUCTOR", entidadId: params.conductorId };
  else if (params.proveedorId) preseleccion = { entidadTipo: "PROVEEDOR", entidadId: params.proveedorId };

  return (
    <div>
      <PageHeader title="Nuevo documento" description="Cargá un seguro, VTV, habilitación u otro documento con vencimiento." />
      <Card>
        <CardContent className="pt-5">
          <DocumentoForm
            options={{ activos, vehiculos, conductores, proveedores, empresas }}
            preseleccion={preseleccion}
          />
        </CardContent>
      </Card>
    </div>
  );
}
