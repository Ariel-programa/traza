"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { crearWebhook, toggleWebhook, eliminarWebhook, type ConfigFormState } from "./actions";
import { Trash2 } from "lucide-react";

const EVENTOS = [
  "ACTIVO_PROXIMO_A_VENCER", "ACTIVO_VENCIDO", "MANTENIMIENTO_PROXIMO",
  "DOCUMENTACION_PROXIMA_A_VENCER", "NUEVO_TRASLADO", "MANTENIMIENTO_REALIZADO",
  "IMPUESTO_PROXIMO_A_VENCER", "IMPUESTO_VENCIDO", "VEHICULO_DOCUMENTACION_PROXIMA_A_VENCER",
];

const initialState: ConfigFormState = {};

export type WebhookRow = { id: string; evento: string; url: string; activo: boolean };

export function WebhooksSection({ webhooks }: { webhooks: WebhookRow[] }) {
  const [state, formAction, pending] = useActionState(crearWebhook, initialState);

  return (
    <div className="space-y-4">
      {webhooks.length > 0 && (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
          {webhooks.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{w.evento}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{w.url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={w.activo ? "success" : "neutral"}>{w.activo ? "Activo" : "Inactivo"}</Badge>
                <form action={toggleWebhook.bind(null, w.id)}>
                  <Button type="submit" size="sm" variant="secondary">{w.activo ? "Desactivar" : "Activar"}</Button>
                </form>
                <form action={eliminarWebhook.bind(null, w.id)}>
                  <Button type="submit" size="sm" variant="ghost" aria-label={`Eliminar webhook de ${w.evento}`}><Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" /></Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px]">
          <Label htmlFor="evento">Evento</Label>
          <Select id="evento" name="evento" defaultValue={EVENTOS[0]}>
            {EVENTOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </div>
        <div className="flex-1 min-w-[240px]">
          <Label htmlFor="url">URL del webhook de n8n</Label>
          <Input id="url" name="url" placeholder="https://n8n.tu-dominio.com/webhook/..." required />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Agregando..." : "Agregar webhook"}</Button>
      </form>
      {state?.error && <p role="alert" className="text-sm text-[var(--danger)]">{state.error}</p>}
      <p className="text-xs text-[var(--text-muted)]">
        TRAZA enviará un POST con el evento y los datos relevantes a esta URL. Configurá un workflow en n8n
        que reciba el webhook y dispare un email o mensaje de WhatsApp.
      </p>
    </div>
  );
}
