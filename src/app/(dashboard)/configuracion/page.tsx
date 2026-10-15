import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { EmpresaForm } from "./empresa-form";
import { WebhooksSection } from "./webhooks";
import { N8nTestButton } from "./n8n-test";

export default async function ConfiguracionPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") redirect("/dashboard");

  const empresa = session.empresaId ? await prisma.empresa.findUnique({ where: { id: session.empresaId } }) : null;
  const webhooks = await prisma.webhookConfig.findMany({
    where: session.rol === "ADMIN" ? {} : { empresaId: session.empresaId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos de la empresa y automatizaciones."
        actions={
          <Button asChild variant="secondary">
            <Link href="/auditoria"><History className="h-4 w-4" /> Ver auditoría</Link>
          </Button>
        }
      />

      {empresa && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la empresa</CardTitle>
            <CardDescription>Esta información aparece en reportes y en la ficha pública de tus activos.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmpresaForm empresa={empresa} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Automatizaciones (n8n)</CardTitle>
          <CardDescription>
            Conectá TRAZA con n8n para disparar emails o mensajes de WhatsApp cuando ocurren eventos importantes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <WebhooksSection webhooks={webhooks} />
          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-sm font-medium mb-1">Prueba de conexión directa</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Dispara el workflow <code className="font-mono">traza_test</code> configurado vía{" "}
              <code className="font-mono">N8N_BASE_URL</code> para verificar que TRAZA puede alcanzar tu
              instancia de n8n.
            </p>
            <N8nTestButton />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email y WhatsApp</CardTitle>
          <CardDescription>Integraciones preparadas para conectar en producción.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-[var(--text-secondary)] space-y-2">
          <p>
            TRAZA no envía emails ni mensajes de WhatsApp directamente. El flujo recomendado es:
            <strong className="text-[var(--text-primary)]"> TRAZA → Webhook → n8n → Email / WhatsApp</strong>.
          </p>
          <p>
            Configurá las variables <code className="font-mono text-xs bg-[var(--surface-muted)] px-1 py-0.5 rounded">SMTP_*</code> del
            archivo <code className="font-mono text-xs bg-[var(--surface-muted)] px-1 py-0.5 rounded">.env</code> para que tu workflow de n8n
            pueda enviar correos, y agregá un webhook de WhatsApp Business API cuando tengas la cuenta habilitada.
            Ver <code className="font-mono text-xs bg-[var(--surface-muted)] px-1 py-0.5 rounded">.env.example</code> y el README para más detalle.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
