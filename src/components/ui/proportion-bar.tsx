// Barra de proporción segmentada -- las anchuras se calculan siempre desde
// los valores reales que recibe (nunca hardcodeadas). Pensada para mostrar
// la composición de una categoría (p. ej. vencido/urgente/próximo dentro de
// "Activos"), no para comparar categorías entre sí.
export type ProportionSegment = {
  value: number;
  colorVar: string; // ej. "var(--danger)"
  label: string;
};

export function ProportionBar({ segments, className }: { segments: ProportionSegment[]; className?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return <div className={`h-1.5 rounded-full bg-[var(--surface-2)] ${className ?? ""}`} />;
  }
  return (
    <div
      className={`flex h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)] ${className ?? ""}`}
      role="img"
      aria-label={segments
        .filter((s) => s.value > 0)
        .map((s) => `${s.label}: ${s.value}`)
        .join(", ")}
    >
      {segments.map((seg, i) =>
        seg.value > 0 ? (
          <span
            key={i}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.colorVar }}
            className="h-full"
          />
        ) : null
      )}
    </div>
  );
}
