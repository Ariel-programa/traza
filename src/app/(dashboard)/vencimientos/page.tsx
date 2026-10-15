import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getVencimientosConsolidados } from "@/lib/vencimientos-center";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { VencimientosTable } from "./vencimientos-table";

const RANGOS = [
  { key: "vencidos", label: "Vencidos", filtro: (dias: number) => dias < 0 },
  { key: "hoy", label: "Hoy", filtro: (dias: number) => dias === 0 },
  { key: "7", label: "Próximos 7 días", filtro: (dias: number) => dias >= 0 && dias <= 7 },
  { key: "30", label: "Próximos 30 días", filtro: (dias: number) => dias >= 0 && dias <= 30 },
  { key: "60", label: "Próximos 60 días", filtro: (dias: number) => dias >= 0 && dias <= 60 },
  { key: "90", label: "Próximos 90 días", filtro: (dias: number) => dias >= 0 && dias <= 90 },
  { key: "todos", label: "Todos", filtro: () => true },
] as const;

export default async function VencimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { rango } = await searchParams;

  const items = await getVencimientosConsolidados(session);
  const vencidos = items.filter((i) => (i.dias ?? 0) < 0).length;
  const proximos7 = items.filter((i) => i.dias !== null && i.dias >= 0 && i.dias <= 7).length;
  const proximos30 = items.filter((i) => i.dias !== null && i.dias >= 0 && i.dias <= 30).length;

  const rangoActivo = RANGOS.find((r) => r.key === rango) ?? RANGOS[3]; // default: 30 días
  const itemsFiltrados = items.filter((i) => i.dias !== null && rangoActivo.filtro(i.dias));

  return (
    <div>
      <PageHeader
        title="Centro de vencimientos"
        description="Todo lo que vence en un solo lugar: activos, documentación, flota, mantenimiento e impuestos."
      />

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-xl">
        <ResumenCard label="Vencidos" value={vencidos} tone="danger" />
        <ResumenCard label="Próximos 7 días" value={proximos7} tone="warning" />
        <ResumenCard label="Próximos 30 días" value={proximos30} tone="caution" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 border-b border-[var(--border)] pb-3">
        {RANGOS.map((r) => (
          <Link
            key={r.key}
            href={r.key === "30" ? "/vencimientos" : `/vencimientos?rango=${r.key}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              rangoActivo.key === r.key
                ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <VencimientosTable data={itemsFiltrados} />
    </div>
  );
}

function ResumenCard({ label, value, tone }: { label: string; value: number; tone: "danger" | "warning" | "caution" }) {
  const toneClass = {
    danger: "text-[var(--danger)]",
    warning: "text-[var(--warning)]",
    caution: "text-[var(--caution)]",
  }[tone];
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}
