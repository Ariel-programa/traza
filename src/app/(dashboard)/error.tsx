"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-soft)] text-[var(--danger)] mb-4">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Algo salió mal</h2>
      <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm">
        Ocurrió un error inesperado al cargar esta página. Podés intentar de nuevo o volver al dashboard.
      </p>
      <div className="flex gap-2 mt-5">
        <Button variant="secondary" onClick={() => reset()}>Reintentar</Button>
        <Button asChild>
          <a href="/dashboard">Ir al dashboard</a>
        </Button>
      </div>
    </div>
  );
}
