// Encabezado de sección tipo instrumento: índice + nombre + línea que se
// extiende. Server Component; se repite en todas las secciones para dar
// ritmo, pero la composición de cada sección debajo es distinta.
export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p className="t-label flex items-center gap-3 mb-8 sm:mb-10">
      <span className="text-[var(--accent-hover)]">{index}</span>
      <span className="text-[var(--text-secondary)]">{children}</span>
      <span className="h-px flex-1 bg-[var(--l-line)]" aria-hidden="true" />
    </p>
  );
}

// Nota fija para todo visual con datos inventados.
export function DemoNote({ children = "Vista ilustrativa · datos de demostración" }: { children?: React.ReactNode }) {
  return (
    <p className="t-label !text-[10.5px] !tracking-[0.1em] flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" aria-hidden="true" />
      {children}
    </p>
  );
}
