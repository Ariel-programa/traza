import { Skeleton } from "@/components/ui/skeleton";

export default function ReportesLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-7 w-40 mb-6" />
      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
