import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-[92px] w-full rounded-[var(--radius-lg)] mb-6" />
      {/* A. Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      {/* B. Atención */}
      <Skeleton className="h-64 w-full mb-4" />
      {/* C. Operación */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      {/* D. Costos */}
      <Skeleton className="h-64 w-full mb-4" />
      <Skeleton className="h-56 w-full mb-6" />
      {/* E. Actividad */}
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
