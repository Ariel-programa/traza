import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { empresaWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Plus, ArrowLeft } from "lucide-react";
import { ConductoresTable } from "./conductores-table";

export default async function ConductoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { error } = await searchParams;

  const conductores = await prisma.conductor.findMany({
    where: empresaWhere(session),
    include: { empresa: true },
    orderBy: { apellido: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Conductores"
        description="Conductores habilitados para operar la flota de vehículos."
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href="/flota"><ArrowLeft className="h-4 w-4" /> Flota</Link>
            </Button>
            <Button asChild>
              <Link href="/flota/conductores/nuevo"><Plus className="h-4 w-4" /> Nuevo conductor</Link>
            </Button>
          </>
        }
      />
      {error === "tiene-historial" && (
        <ErrorBanner>
          No se puede eliminar este conductor porque tiene traslados, cargas de combustible, documentos o un usuario asociado.
          Para conservar la trazabilidad, primero tendrías que desvincular ese historial.
        </ErrorBanner>
      )}
      <ConductoresTable data={conductores} showEmpresa={session.rol === "ADMIN"} />
    </div>
  );
}
