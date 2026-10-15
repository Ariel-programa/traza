"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actualizarUbicacionVehiculo } from "./actions";

// Sin GPS instalado en la flota: este botón toma la ubicación real del
// dispositivo (celular del conductor, compu del admin) en el momento en que
// se toca, vía la Geolocation API del navegador. No es rastreo continuo --
// es una foto puntual que después se ve en /monitoreo.
export function UbicacionButton({ vehiculoId }: { vehiculoId: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "locating" | "saving" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  function handleClick() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Este dispositivo/navegador no soporta geolocalización.");
      return;
    }
    setError(null);
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("saving");
        const result = await actualizarUbicacionVehiculo(vehiculoId, pos.coords.latitude, pos.coords.longitude);
        if (result.ok) {
          setStatus("idle");
          router.refresh();
        } else {
          setStatus("error");
          setError(result.error);
        }
      },
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Habilitalo en el navegador para actualizar la posición."
            : "No se pudo obtener la ubicación."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const loading = status === "locating" || status === "saving";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {status === "locating" ? "Ubicando…" : "Guardando…"}
          </>
        ) : (
          <>
            <MapPin className="h-3.5 w-3.5" /> Actualizar ubicación
          </>
        )}
      </Button>
      {error && <p className="text-xs text-[var(--danger)] max-w-[220px] text-right">{error}</p>}
    </div>
  );
}
