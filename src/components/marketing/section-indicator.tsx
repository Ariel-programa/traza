"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";

const STOPS = [
  { id: "problema", n: "01" },
  { id: "plataforma", n: "02" },
  { id: "trazabilidad", n: "03" },
  { id: "flota", n: "04" },
  { id: "conductores", n: "05" },
  { id: "gastos", n: "06" },
  { id: "documentacion", n: "07" },
  { id: "producto", n: "08" },
  { id: "planes", n: "09" },
];

// Indicador lateral (solo xl): una línea que se traza con el scroll de toda
// la página y una parada por sección. Los estados se escriben como
// data-attributes desde ScrollTrigger -- sin estado de React por scroll.
export function SectionIndicator() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const fill = el.querySelector<HTMLElement>("[data-fill]");
      // Elementos, no selectores: dentro de useGSAP los strings se buscan en
      // el scope (esta nav) y las secciones están fuera de él.
      const first = document.getElementById(STOPS[0].id);
      const last = document.getElementById(STOPS[STOPS.length - 1].id);
      if (fill && first && last) {
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: first, start: "top center", endTrigger: last, end: "bottom center", scrub: true },
          }
        );
      }
      const setState = (id: string, state: string) => {
        const stop = el.querySelector<HTMLElement>(`[data-for="${id}"]`);
        if (stop) stop.dataset.state = state;
      };
      STOPS.forEach((s) => {
        const section = document.getElementById(s.id);
        if (!section) return;
        ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
          onEnter: () => setState(s.id, "current"),
          onEnterBack: () => setState(s.id, "current"),
          onLeave: () => setState(s.id, "passed"),
          onLeaveBack: () => setState(s.id, "next"),
        });
      });
    },
    { scope: root }
  );

  return (
    <nav ref={root} aria-label="Progreso por secciones" className="section-indicator fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <div className="relative flex flex-col gap-4">
        <span className="absolute right-[4px] top-1 bottom-1 w-px bg-[var(--l-line-strong)]" aria-hidden="true">
          <span data-fill className="absolute inset-0 origin-top bg-[var(--accent)]" style={{ transform: "scaleY(0)" }} />
        </span>
        {STOPS.map((s) => (
          <a key={s.id} href={`#${s.id}`} data-for={s.id} data-state="next" className="indicator-stop relative flex items-center justify-end gap-2.5">
            <span className="t-mono text-[10px] text-[var(--text-muted)]">{s.n}</span>
            <span className="indicator-dot block h-[9px] w-[9px] rounded-full border" aria-hidden="true" />
          </a>
        ))}
      </div>
    </nav>
  );
}
