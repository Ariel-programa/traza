import { prisma } from "@/lib/prisma";

// Dispara los webhooks activos configurados para un evento hacia n8n.
// Es "fire and forget": si el webhook falla, no interrumpe el flujo de TRAZA.
export async function triggerWebhooks(evento: string, empresaId: string | null, payload: Record<string, unknown>) {
  const webhooks = await prisma.webhookConfig.findMany({
    where: {
      evento,
      activo: true,
      OR: [{ empresaId: null }, { empresaId }],
    },
  });

  await Promise.allSettled(
    webhooks.map((w) =>
      fetch(w.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento, empresaId, timestamp: new Date().toISOString(), data: payload }),
      }).catch(() => null)
    )
  );
}
