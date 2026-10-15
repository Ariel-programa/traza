// Donut genérico -- proporciones calculadas siempre desde `data`, nunca
// hardcodeadas. Incluye leyenda con el valor real de cada segmento para no
// depender solo del color (accesibilidad).
export type DonutDatum = { label: string; value: number; colorVar: string };

export function DonutChart({
  data,
  size = 96,
  strokeWidth = 14,
  centerLabel,
}: {
  data: DonutDatum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: { value: string; sub: string };
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <div className="flex items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={strokeWidth} />
        {total > 0 &&
          data.map((d, i) => {
            if (d.value === 0) return null;
            const length = (d.value / total) * circumference;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.colorVar}
                strokeWidth={strokeWidth}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offsetAcc}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offsetAcc += length;
            return el;
          })}
        {centerLabel && (
          <>
            <text x="50%" y="47%" textAnchor="middle" className="fill-[var(--text-primary)]" style={{ fontSize: 17, fontWeight: 700 }}>
              {centerLabel.value}
            </text>
            <text x="50%" y="63%" textAnchor="middle" className="fill-[var(--text-muted)]" style={{ fontSize: 10.5 }}>
              {centerLabel.sub}
            </text>
          </>
        )}
      </svg>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 min-w-0 text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.colorVar }} />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="font-semibold tabular-nums shrink-0">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
