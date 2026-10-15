"use client";

import * as React from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanTicketImage } from "@/lib/scan-ticket-combustible";
import type { TicketParseResult } from "@/lib/parse-ticket-combustible";

export function TicketScanner({
  onScanned,
  initialPhoto,
  initialScanned,
}: {
  onScanned: (result: TicketParseResult, fotoDataUrl: string) => void;
  initialPhoto?: string | null;
  initialScanned?: boolean;
}) {
  const [photo, setPhoto] = React.useState<string | null>(initialPhoto ?? null);
  const [status, setStatus] = React.useState<"idle" | "reading" | "done" | "error">(initialScanned ? "done" : "idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // El escaneo puede haber ocurrido antes de montar este componente (botón
  // rápido de la lista, ver quick-scan-button.tsx): el padre recupera el
  // resultado pendiente en su propio efecto y nos llega acá vía props luego
  // del primer render, no en el mount.
  React.useEffect(() => {
    if (initialPhoto && !photo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync con el resultado del escaneo pendiente que resuelve el padre (fuente externa), no estado derivable en el render
      setPhoto(initialPhoto);
      if (initialScanned) setStatus("done");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar cuando el padre resuelve el escaneo pendiente
  }, [initialPhoto, initialScanned]);

  async function handleFile(file: File) {
    setError(null);
    setStatus("reading");
    setProgress(0);
    try {
      const { parsed, fotoDataUrl } = await scanTicketImage(file, setProgress);
      setPhoto(fotoDataUrl);
      setStatus("done");
      onScanned(parsed, fotoDataUrl);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo escanear el ticket.");
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-4 space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex items-start gap-3">
        {photo ? (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL local, no aplica optimización de next/image */}
            <img src={photo} alt="Foto del ticket" className="h-20 w-20 rounded-[var(--radius-sm)] object-cover border border-[var(--border)]" />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                setStatus("idle");
                setError(null);
              }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[var(--surface)] border border-[var(--border-strong)] flex items-center justify-center"
              aria-label="Quitar foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-muted)]">
            <Camera className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-medium">Escanear ticket</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Sacá una foto del ticket de la carga y completamos litros, precio y fecha automáticamente. Siempre podés corregir los campos antes de guardar.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={status === "reading"}>
            {status === "reading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Leyendo ticket… {progress}%
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" /> {photo ? "Tomar otra foto" : "Sacar foto"}
              </>
            )}
          </Button>
          {status === "done" && <p className="text-xs text-[var(--success,#16a34a)]">Ticket escaneado. Revisá los campos antes de guardar.</p>}
          {error && <p className="text-xs text-[var(--danger)]">{error} Completá los campos manualmente.</p>}
        </div>
      </div>
    </div>
  );
}
