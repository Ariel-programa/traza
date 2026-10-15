"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

// El contenido scrollea dentro de este <main> (no en window/document), así
// que la restauración de scroll nativa del navegador no aplica -- cada ruta
// visitada guarda su propio scrollTop acá y se restaura al volver, en vez de
// arrancar siempre desde arriba. Vive en memoria (no sessionStorage): dura
// lo que dura la pestaña, que es lo que importa para "volver atrás".
const scrollMemory = new Map<string, number>();

export function ScrollableMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = React.useRef<HTMLElement>(null);
  const [showTop, setShowTop] = React.useState(false);
  const key = `${pathname}?${searchParams.toString()}`;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = scrollMemory.get(key) ?? 0;
    setShowTop((scrollMemory.get(key) ?? 0) > 400);
  }, [key]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function handleScroll() {
      const top = el!.scrollTop;
      scrollMemory.set(key, top);
      setShowTop(top > 400);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [key]);

  return (
    <main ref={ref} className="flex-1 overflow-y-auto thin-scroll bg-[var(--surface-muted)] p-4 lg:p-6 relative">
      {children}
      {showTop && (
        <div className="fixed bottom-6 right-6 z-40">
          <FloatingButton label="Ir al principio" onClick={() => ref.current?.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUp className="h-4 w-4" />
          </FloatingButton>
        </div>
      )}
    </main>
  );
}

function FloatingButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "h-10 w-10 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-[var(--shadow-lg)]",
        "flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {children}
    </button>
  );
}
