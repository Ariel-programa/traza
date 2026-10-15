"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { tipoActivoLabel } from "@/lib/format";

export function ActivosTipoChart({ data }: { data: { tipo: string; cantidad: number }[] }) {
  const rows = data.map((d) => ({ label: tipoActivoLabel(d.tipo), cantidad: d.cantidad })).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 30)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
        <Tooltip
          cursor={{ fill: "var(--surface-hover)" }}
          contentStyle={{
            borderRadius: 10,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            color: "var(--text-primary)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="cantidad" fill="var(--brand)" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
