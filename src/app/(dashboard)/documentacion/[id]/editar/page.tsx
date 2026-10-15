import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentoForm } from "../../documento-form";
import { assertEntidadPermitida } from "../../actions";

export default async function EditarDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) notFound();
  const permitido = await assertEntidadPermitida(documento.entidadTipo, documento.entidadId, session.empresaId, session.rol === "ADMIN");
  if (!permitido) notFound();

  const [{ empresas, proveedores, vehiculos, conductores }, activos] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
  ]);

  return (
    <div>
      <PageHeader title={`Editar ${documento.tipo}`} />
      <Card>
        <CardContent className="pt-5">
          <DocumentoForm
            options={{ activos, vehiculos, conductores, proveedores, empresas }}
            documentoId={id}
            preseleccion={{ entidadTipo: documento.entidadTipo, entidadId: documento.entidadId }}
            defaultValues={{
              tipo: documento.tipo,
              numero: documento.numero ?? undefined,
              fechaEmision: documento.fechaEmision?.toISOString().slice(0, 10),
              vencimiento: documento.vencimiento?.toISOString().slice(0, 10),
              archivoUrl: documento.archivoUrl ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
