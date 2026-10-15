import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DocumentosTable, type DocumentoRow } from "./documentos-table";

export default async function DocumentacionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const where = empresaWhere(session);

  const [documentos, empresas] = await Promise.all([
    prisma.documento.findMany({
      where: {
        OR: [
          { activo: where },
          { vehiculo: where },
          { conductor: where },
          { proveedor: where },
          session.rol === "ADMIN" ? { entidadTipo: "EMPRESA" } : { entidadTipo: "EMPRESA", entidadId: session.empresaId ?? "__none__" },
        ],
      },
      include: { activo: true, vehiculo: true, conductor: true, proveedor: true },
      orderBy: { vencimiento: "asc" },
    }),
    prisma.empresa.findMany(),
  ]);

  const empresaMap = new Map(empresas.map((e) => [e.id, e.nombre]));

  const rows: DocumentoRow[] = documentos.map((d) => ({
    id: d.id,
    entidadTipo: d.entidadTipo,
    tipo: d.tipo,
    numero: d.numero,
    fechaEmision: d.fechaEmision?.toISOString() ?? null,
    vencimiento: d.vencimiento?.toISOString() ?? null,
    estado: d.estado,
    entidadLabel:
      d.activo?.nombre ??
      (d.vehiculo ? `${d.vehiculo.patente} · ${d.vehiculo.marca}` : undefined) ??
      (d.conductor ? `${d.conductor.nombre} ${d.conductor.apellido}` : undefined) ??
      d.proveedor?.nombre ??
      empresaMap.get(d.entidadId) ??
      "—",
  }));

  return (
    <div>
      <PageHeader
        title="Documentación"
        description="Seguros, VTV, habilitaciones, garantías y certificados de activos, vehículos, conductores, proveedores y la empresa."
        actions={
          <Button asChild>
            <Link href="/documentacion/nuevo"><Plus className="h-4 w-4" /> Nuevo documento</Link>
          </Button>
        }
      />
      <DocumentosTable data={rows} />
    </div>
  );
}
