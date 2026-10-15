import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/form-options";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ImpuestoForm } from "../../impuesto-form";

export default async function EditarImpuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const impuesto = await prisma.impuesto.findUnique({ where: { id } });
  if (!impuesto) notFound();
  if (session.rol !== "ADMIN" && impuesto.empresaId !== session.empresaId) notFound();

  const [{ empresas, vehiculos }, activos] = await Promise.all([
    getFormOptions(session),
    prisma.activo.findMany({ where: empresaWhere(session), orderBy: { codigo: "asc" }, select: { id: true, codigo: true, nombre: true } }),
  ]);

  return (
    <div>
      <PageHeader title={`Editar ${impuesto.nombre}`} />
      <Card>
        <CardContent className="pt-5">
          <ImpuestoForm
            options={{ empresas, vehiculos, activos }}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            impuestoId={id}
            defaultValues={{
              nombre: impuesto.nombre,
              vehiculoId: impuesto.vehiculoId ?? undefined,
              activoId: impuesto.activoId ?? undefined,
              importe: impuesto.importe.toString(),
              vencimiento: impuesto.vencimiento.toISOString().slice(0, 10),
              fechaPago: impuesto.fechaPago?.toISOString().slice(0, 10),
              comprobanteUrl: impuesto.comprobanteUrl ?? undefined,
              observaciones: impuesto.observaciones ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
