import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UsuarioForm } from "../usuario-form";

export default async function NuevoUsuarioPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") redirect("/dashboard");

  const empresas = session.rol === "ADMIN" ? await prisma.empresa.findMany({ orderBy: { nombre: "asc" } }) : [];

  return (
    <div>
      <PageHeader title="Nuevo usuario" description="Invitá a una persona a usar TRAZA con el rol adecuado." />
      <Card>
        <CardContent className="pt-5">
          <UsuarioForm empresas={empresas} isAdmin={session.rol === "ADMIN"} />
        </CardContent>
      </Card>
    </div>
  );
}
