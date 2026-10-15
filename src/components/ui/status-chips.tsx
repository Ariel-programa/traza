// Alternativa compacta al donut cuando la cardinalidad es baja (ej. un
// único vehículo, pocas operaciones): un donut de 1-2 valores no comunica
// nada que el número solo no diga ya. Nunca depende solo del color -- cada
// chip lleva label + valor.
export type StatusChipDatum = { label: string; value: number; colorVar: string };

export function StatusChips({ data }: { data: StatusChipDatum[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((d) => (
        <span
          key={d.label}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: d.colorVar }} aria-hidden="true" />
          {d.label}
          <span className="tabular-nums font-semibold text-[var(--text-primary)]">{d.value}</span>
        </span>
      ))}
    </div>
  );
}
