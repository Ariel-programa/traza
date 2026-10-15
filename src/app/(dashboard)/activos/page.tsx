import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { tipoActivoLabel } from "@/lib/format";
import { Plus, Box } from "lucide-react";
import type { TipoActivo } from "@prisma/client";
import { ActivosTable } from "./activos-table";

const TITULOS: Record<string, string> = {
  MATAFUEGO: "Matafuegos",
  EQUIPO_MEDICO: "Equipos médicos",
  OTRO: "Otros activos",
};

// Estados vacíos específicos por tipo -- "sin datos" no explica nada; esto
// dice qué significa la sección y qué se puede controlar una vez que haya
// un registro. El caso sin `tipo` (listado general) usa un mensaje más
// genérico, ya cubierto por ActivosTable/DataTable.
const EMPTY_DESCRIPCION: Record<string, string> = {
  MATAFUEGO: "Registrá un matafuego para empezar a controlar su vencimiento, inspecciones y recargas.",
  EQUIPO_MEDICO: "Registrá un equipo médico para controlar su documentación, mantenimiento y calibraciones.",
  OTRO: "Registrá herramientas, maquinaria u otro equipo para trazar su documentación y vencimientos.",
};

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { tipo } = await searchParams;

  const activos = await prisma.activo.findMany({
    where: { ...empresaWhere(session), ...(tipo ? { tipo: tipo as TipoActivo } : {}) },
    include: { empresa: true, ubicacion: true, proveedor: true },
    orderBy: { createdAt: "desc" },
  });

  const titulo = tipo ? TITULOS[tipo] ?? tipoActivoLabel(tipo) : "Activos";
  const puedeGestionar = session.rol === "ADMIN" || session.rol === "EMPRESA";

  return (
    <div>
      <PageHeader
        title={titulo}
        description="Gestioná todos los activos de la empresa: matafuegos, equipos médicos y más."
        actions={
          <Button asChild>
            <Link href="/activos/nuevo"><Plus className="h-4 w-4" /> Nuevo activo</Link>
          </Button>
        }
      />
      {activos.length === 0 && tipo && EMPTY_DESCRIPCION[tipo] ? (
        <EmptyState
          title={`Sin ${titulo.toLowerCase()} registrados`}
          description={EMPTY_DESCRIPCION[tipo]}
          icon={<Box className="h-8 w-8" />}
          action={
            puedeGestionar && (
              <Button asChild size="sm">
                <Link href="/activos/nuevo"><Plus className="h-3.5 w-3.5" /> Nuevo activo</Link>
              </Button>
            )
          }
        />
      ) : (
        <ActivosTable activos={activos} showEmpresa={session.rol === "ADMIN"} />
      )}
    </div>
  );
}
