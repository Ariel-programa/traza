import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Línea de tiempo con nodos -- el mismo lenguaje visual del isotipo (origen
// hueco / trayectoria / destino). Reutilizable para cualquier historial
// cronológico real (actividad del dashboard hoy; mantenimiento de un activo
// más adelante). No renderiza nada si `items` está vacío -- el estado vacío
// queda a cargo de quien lo use.
export type TimelineItem = {
  id: string;
  content: ReactNode;
  time: string;
  nodeColorVar?: string;
  haloColorVar?: string;
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ul className={cn("relative", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <li key={item.id} className={cn("relative pl-6", !isLast && "pb-5")}>
            {!isLast && (
              <span className="absolute left-[3px] top-1 bottom-[-10px] w-px bg-[var(--border-strong)]" aria-hidden="true" />
            )}
            <span
              className="absolute left-0 top-[3px] h-2 w-2 rounded-full ring-[3px]"
              style={{
                background: item.nodeColorVar ?? "var(--accent)",
                boxShadow: `0 0 0 3px ${item.haloColorVar ?? "var(--accent-soft)"}`,
              }}
              aria-hidden="true"
            />
            <div className="text-[13px] leading-snug">{item.content}</div>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">{item.time}</p>
          </li>
        );
      })}
    </ul>
  );
}
