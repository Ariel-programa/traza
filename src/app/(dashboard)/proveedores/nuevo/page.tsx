import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFormOptions } from "@/lib/form-options";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProveedorForm } from "../proveedor-form";
import { createProveedor } from "../actions";

export default async function NuevoProveedorPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { empresas } = await getFormOptions(session);

  return (
    <div>
      <PageHeader title="Nuevo proveedor" description="Registrá un proveedor de servicios." />
      <Card>
        <CardContent className="pt-5">
          <ProveedorForm
            action={createProveedor}
            empresas={empresas}
            fixedEmpresaId={session.rol === "ADMIN" ? undefined : session.empresaId ?? undefined}
            submitLabel="Crear proveedor"
          />
        </CardContent>
      </Card>
    </div>
  );
}
