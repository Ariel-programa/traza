import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Banda de identidad del Dashboard -- glass sobre gradiente navy/azul
// tecnológico, con el isotipo de TRAZA como trazo de fondo muy sutil
// (opacidad baja, no interfiere con la lectura). No es una tarjeta
// decorativa: siempre expone la acción real hacia el Centro de Atención.
export function DashboardHero({
  saludo,
  fecha,
  totalAtencion,
  resumen,
}: {
  saludo: string;
  fecha: string;
  totalAtencion: number;
  /** Ej. "6 activos · 5 documentos · 3 impuestos" -- solo si hay datos reales que resumir. */
  resumen?: string;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--brand)]/25 via-[var(--surface)] to-[var(--surface)] px-6 py-6 mb-6">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07] pointer-events-none"
        viewBox="0 0 800 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="40" cy="120" r="5" stroke="white" strokeWidth="3" fill="none" />
        <path d="M40 120 C 220 20, 560 200, 760 40" stroke="white" strokeWidth="3" fill="none" />
        <circle cx="760" cy="40" r="7" fill="var(--accent)" />
      </svg>
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{saludo}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">
            Este es el estado actual de tu operación
            <span className="text-[var(--text-muted)]"> · {fecha}</span>
          </p>
          {resumen && <p className="text-xs text-[var(--text-muted)] mt-2">{resumen}</p>}
        </div>
        <div className="flex flex-col items-end gap-2.5">
          {totalAtencion > 0 && (
            <span className="inline-flex items-baseline gap-2 rounded-full border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3.5 py-1.5">
              <b className="text-lg leading-none tabular-nums text-[var(--danger)]">{totalAtencion}</b>
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                requiere{totalAtencion === 1 ? "" : "n"} atención
              </span>
            </span>
          )}
          <Button asChild size="sm" variant={totalAtencion > 0 ? "primary" : "secondary"}>
            <Link href="/vencimientos">
              Ver centro de atención <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
