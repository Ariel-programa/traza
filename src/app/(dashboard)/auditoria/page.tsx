import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";

const ACCION_LABEL: Record<string, string> = {
  CREAR: "Creó", EDITAR: "Editó", ELIMINAR: "Eliminó", LOGIN: "Inició sesión", LOGIN_FALLIDO: "Intento de login fallido",
  ACTIVAR: "Activó", DESACTIVAR: "Desactivó", CONTRATAR_PLAN: "Contrató plan",
};

export default async function AuditoriaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    where: session.rol === "ADMIN" ? {} : { empresaId: session.empresaId },
    include: { user: true },
    orderBy: { fecha: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Historial de acciones realizadas en TRAZA: quién hizo qué y cuándo."
      />
      {logs.length === 0 ? (
        <EmptyState title="Sin actividad registrada" description="Las acciones que se realicen en la plataforma van a aparecer acá." />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <ul className="divide-y divide-[var(--border)]">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <span className="font-medium">{log.user ? `${log.user.nombre} ${log.user.apellido}` : "Sistema"}</span>
                  <span className="text-[var(--text-secondary)]"> {ACCION_LABEL[log.accion] ?? log.accion} </span>
                  <span className="text-[var(--text-muted)]">{log.entidad}{log.detalle ? ` · ${log.detalle}` : ""}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)] shrink-0">{formatDateTime(log.fecha)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
