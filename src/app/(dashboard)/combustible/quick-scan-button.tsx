"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanTicketImage, savePendingTicketScan } from "@/lib/scan-ticket-combustible";

// Atajo desde la lista de Combustible: saca la foto y escanea el ticket sin
// pasar primero por el formulario -- al terminar navega a /combustible/nuevo
// ya con los campos completados. El resultado viaja por sessionStorage
// (ver scan-ticket-combustible.ts) porque la navegación cambia de página.
export function QuickScanButton({ vehiculoId, size = "icon" }: { vehiculoId?: string; size?: "icon" | "sm" } = {}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const { parsed, fotoDataUrl } = await scanTicketImage(file);
      savePendingTicketScan(parsed, fotoDataUrl);
      router.push(vehiculoId ? `/combustible/nuevo?vehiculoId=${vehiculoId}` : "/combustible/nuevo");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "No se pudo escanear el ticket.");
    }
  }

  return (
    <div className="flex items-center gap-2">
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
      <Button
        type="button"
        variant="outline"
        size={size}
        className={size === "sm" ? "w-8 px-0" : undefined}
        title="Sacar foto al ticket y cargar automático"
        aria-label="Sacar foto al ticket y cargar automático"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </Button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
