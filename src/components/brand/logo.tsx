import { cn } from "@/lib/utils";

// Isotipo: una T cuya barra se convierte en trayectoria -- arranca en un
// punto de partida (círculo hueco) y termina en un punto de llegada sólido
// (el estado actual, siempre en el color de acento). El trazo usa
// currentColor: el color de marca/wordmark se controla desde afuera con
// className (ver login/page.tsx para el caso de fondo oscuro), y el punto
// de llegada se mantiene en --accent sin importar el contexto.
export function Logo({
  className,
  mark = true,
  wordmark = true,
}: {
  className?: string;
  mark?: boolean;
  /** Ocultar el texto "TRAZA" -- para el sidebar colapsado (solo isotipo). */
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 select-none text-[var(--brand)]", className)}>
      {mark && (
        <svg width="22" height="22" viewBox="0 0 48 48" fill="none" className="shrink-0" aria-hidden="true">
          <circle cx="9" cy="14" r="2.4" stroke="currentColor" strokeWidth="3.4" />
          <path d="M13 14 H24" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M24 14 V36" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M24 14 C31 14 37 18 39 25" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <circle cx="39.5" cy="26.5" r="3.8" fill="var(--accent)" />
        </svg>
      )}
      {wordmark && <span className="text-[15px] font-semibold tracking-tight">TRAZA</span>}
    </span>
  );
}
