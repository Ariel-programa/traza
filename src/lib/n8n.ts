// Cliente para disparar workflows puntuales de n8n bajo demanda (distinto de
// src/lib/webhooks.ts, que dispara los webhooks por evento configurados en
// WebhookConfig). Pensado para automatizaciones on-demand desde TRAZA, como
// el botón "Probar conexión con n8n" en Configuración.

const TIMEOUT_MS = 8000;

export type N8nTriggerResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; error: "NOT_CONFIGURED"; detail: string }
  | { ok: false; error: "TIMEOUT" }
  | { ok: false; error: "NETWORK_ERROR"; detail: string }
  | { ok: false; error: "HTTP_ERROR"; status: number; detail: string };

// Dispara el workflow `workflowId` de n8n (ruta convencional /webhook/<id>)
// con un payload { event, timestamp, source, data }. Nunca lanza: siempre
// devuelve un resultado tipado para que el caller decida cómo responder.
export async function triggerN8nWorkflow(
  workflowId: string,
  data: Record<string, unknown>
): Promise<N8nTriggerResult> {
  const baseUrl = process.env.N8N_BASE_URL;
  if (!baseUrl) {
    console.error(`[n8n] N8N_BASE_URL no configurado: no se pudo disparar el workflow "${workflowId}".`);
    return { ok: false, error: "NOT_CONFIGURED", detail: "N8N_BASE_URL no está configurado." };
  }

  const secret = process.env.N8N_WEBHOOK_SECRET;
  const url = `${baseUrl.replace(/\/+$/, "")}/webhook/${workflowId}`;
  const payload = {
    event: workflowId,
    timestamp: new Date().toISOString(),
    source: "traza",
    data,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Traza-Secret": secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const bodyText = await res.text();
    const body = bodyText ? safeJsonParse(bodyText) : null;

    if (!res.ok) {
      console.error(`[n8n] El workflow "${workflowId}" respondió ${res.status}: ${bodyText.slice(0, 500)}`);
      return { ok: false, error: "HTTP_ERROR", status: res.status, detail: bodyText.slice(0, 500) };
    }

    return { ok: true, status: res.status, body };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[n8n] Timeout de ${TIMEOUT_MS}ms al disparar el workflow "${workflowId}" en ${url}.`);
      return { ok: false, error: "TIMEOUT" };
    }
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[n8n] Error de red al disparar el workflow "${workflowId}" en ${url}: ${detail}`);
    return { ok: false, error: "NETWORK_ERROR", detail };
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
