import { prisma } from "@/lib/prisma";
import { validarUrlWebhook } from "@/lib/webhook-url";

const TIMEOUT_MS = 8000;

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
    webhooks
      // Se revalida al enviar: cubre webhooks creados antes de esta regla.
      .filter((w) => validarUrlWebhook(w.url) === null)
      .map((w) =>
        fetch(w.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evento, empresaId, timestamp: new Date().toISOString(), data: payload }),
          // Sin seguir redirects: un 302 hacia una IP interna saltearía la validación.
          redirect: "manual",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }).catch(() => null)
      )
  );
}
