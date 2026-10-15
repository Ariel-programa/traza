// Mini-gráfico de línea para una tarjeta -- solo debe usarse cuando existe
// una serie histórica real detrás (ver lib/dashboard.ts). No inventar series.
export function Sparkline({
  data,
  width = 120,
  height = 32,
  colorVar = "var(--brand)",
  dotColorVar = "var(--accent)",
}: {
  data: number[];
  width?: number;
  height?: number;
  colorVar?: string;
  dotColorVar?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Evolución: ${data.join(", ")}`}
      className="block"
    >
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={colorVar}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={dotColorVar} />
    </svg>
  );
}
