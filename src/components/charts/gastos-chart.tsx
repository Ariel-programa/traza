"use client";

import * as React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/format";

export type GastoMes = { mes: string; gastos: number; combustible: number };

const RANGOS = [
  { key: "6m", label: "6 meses", meses: 6 },
  { key: "12m", label: "12 meses", meses: 12 },
] as const;

// Filtro de período: recorta la serie que ya trae el servidor (12 meses
// reales desde getDashboardData) -- nunca inventa datos, solo cambia
// cuántos meses de la misma serie se muestran.
export function GastosChart({ data }: { data: GastoMes[] }) {
  const [rango, setRango] = React.useState<(typeof RANGOS)[number]["key"]>("6m");
  const activo = RANGOS.find((r) => r.key === rango) ?? RANGOS[0];
  const visible = data.slice(-activo.meses);

  return (
    <div>
      <div className="flex justify-end gap-1 mb-2">
        {RANGOS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRango(r.key)}
            aria-pressed={rango === r.key}
            className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors ${
              rango === r.key
                ? "bg-[var(--brand-soft)] text-[var(--brand-hover)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={visible} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            width={44}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-hover)" }}
            formatter={(value, name) => [formatCurrency(Number(value) || 0), name === "gastos" ? "Gastos" : "Combustible"]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          <Legend
            formatter={(value) => (value === "gastos" ? "Gastos" : "Combustible")}
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
          />
          <Bar dataKey="gastos" stackId="total" fill="var(--brand)" radius={[0, 0, 0, 0]} maxBarSize={30} />
          <Bar dataKey="combustible" stackId="total" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
