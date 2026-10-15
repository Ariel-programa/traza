import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UsuariosTable } from "./usuarios-table";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") redirect("/dashboard");

  const usuarios = await prisma.user.findMany({
    where: session.rol === "ADMIN" ? {} : { empresaId: session.empresaId },
    include: { empresa: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Personas con acceso a TRAZA y su rol dentro de la plataforma."
        actions={
          <Button asChild>
            <Link href="/usuarios/nuevo"><Plus className="h-4 w-4" /> Nuevo usuario</Link>
          </Button>
        }
      />
      <UsuariosTable data={usuarios} showEmpresa={session.rol === "ADMIN"} />
    </div>
  );
}
