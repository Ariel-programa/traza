"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";
import { GASTOS_DEMO } from "@/components/marketing/demo-data";

const max = Math.max(...GASTOS_DEMO.map((g) => g.importe));
const total = GASTOS_DEMO.reduce((s, g) => s + g.importe, 0);
const ars = (n: number) => `$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

// Gastos del mes por categoría (CategoriaGasto). Barras que crecen desde la
// izquierda con transform (scaleX), nunca animando width.
export function ExpenseBars() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from("[data-bar]", {
          scaleX: 0,
          duration: 1,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 80%", toggleActions: "play none none reverse" },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="l-panel p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-5">
        <p className="t-label">Gastos del mes por categoría</p>
        <p className="t-mono text-sm text-[var(--text-primary)]">{ars(total)}</p>
      </div>
      <ul className="space-y-3.5">
        {GASTOS_DEMO.map((g) => (
          <li key={g.categoria} className="grid grid-cols-[110px_1fr_auto] items-center gap-3">
            <span className="text-[13px] text-[var(--text-secondary)]">{g.categoria}</span>
            <span className="h-2 rounded-[2px] bg-[var(--l-line)] overflow-hidden" aria-hidden="true">
              <span
                data-bar
                className="block h-full origin-left bg-[var(--brand)]"
                style={{ transform: `scaleX(${g.importe / max})`, transformOrigin: "left" }}
              />
            </span>
            <span className="t-mono text-[12px] text-[var(--text-muted)] tabular-nums">{ars(g.importe)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
