"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";
import { DOCUMENTOS_DEMO, estadoDocumento } from "@/components/marketing/demo-data";

// Eje de tiempo de vencimientos: de -30 a +180 días, con "hoy" marcado.
// Cada documento es un marcador coloreado por su estado real
// (Vigente / Próximo a vencer / Vencido). El eje es decorativo; la lista de
// abajo es el contenido accesible.
const MIN = -30;
const MAX = 180;
const pos = (d: number) => ((d - MIN) / (MAX - MIN)) * 100;
const TICKS = [-30, 0, 30, 60, 90, 120, 150, 180];

const TONE_VAR = { success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)", info: "var(--info)", muted: "var(--text-muted)" };

export function ExpiryRuler() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 78%", toggleActions: "play none none reverse" },
        });
        tl.from("[data-axis]", { scaleX: 0, duration: 0.9, ease: "power2.inOut" })
          .from("[data-today]", { scaleY: 0, autoAlpha: 0, duration: 0.4 }, "-=0.3")
          .from("[data-marker]", { y: -14, autoAlpha: 0, stagger: 0.08, duration: 0.5, ease: "back.out(2)" }, "-=0.1")
          .from("[data-doc-row]", { autoAlpha: 0, y: 10, stagger: 0.05, duration: 0.4 }, "-=0.4");
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      {/* Eje (desktop/tablet) */}
      <div className="relative hidden sm:block h-36 mb-8" aria-hidden="true">
        <div data-axis className="absolute left-0 right-0 top-[88px] h-px origin-left bg-[var(--l-line-strong)]" />
        {TICKS.map((t) => (
          <div key={t} className="absolute top-[88px]" style={{ left: `${pos(t)}%` }}>
            <span className="block h-2 w-px bg-[var(--l-line-strong)]" />
            <span className="t-mono absolute top-3 -translate-x-1/2 text-[10px] text-[var(--text-muted)] whitespace-nowrap">
              {t === 0 ? "HOY" : `${t > 0 ? "+" : ""}${t} d`}
            </span>
          </div>
        ))}
        <div data-today className="absolute top-2 h-[86px] w-px origin-bottom bg-[var(--text-secondary)]" style={{ left: `${pos(0)}%` }} />
        {DOCUMENTOS_DEMO.map((d, i) => {
          const est = estadoDocumento(d.dias);
          return (
            <div
              key={`${d.tipo}-${d.entidad}`}
              className="absolute"
              style={{
                left: `${pos(d.dias)}%`,
                top: `${14 + (i % 3) * 22}px`,
                // El punto cae sobre la fecha; la etiqueta se abre hacia el lado con lugar
                transform: pos(d.dias) > 65 ? "translateX(calc(-100% + 5px))" : "translateX(-5px)",
              }}
            >
              <span data-marker className={`flex items-center gap-1.5 whitespace-nowrap ${pos(d.dias) > 65 ? "flex-row-reverse" : ""}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONE_VAR[est.tone] }} />
                <span className="t-mono text-[10.5px] text-[var(--text-secondary)]">
                  {d.tipo === "Licencia de conducir" ? "Licencia" : d.tipo} · {d.entidad}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Lista (contenido real, accesible) */}
      <div className="overflow-x-auto" data-lenis-prevent>
      <table className="w-full min-w-[420px] text-left">
        <caption className="sr-only">Documentos de ejemplo con su estado de vencimiento</caption>
        <thead>
          <tr className="t-label !text-[10.5px] border-b border-[var(--l-line)]">
            <th scope="col" className="py-2.5 pr-3 font-normal">Documento</th>
            <th scope="col" className="py-2.5 pr-3 font-normal">Asociado a</th>
            <th scope="col" className="py-2.5 pr-3 font-normal hidden sm:table-cell">Vencimiento</th>
            <th scope="col" className="py-2.5 font-normal">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--l-line)]">
          {DOCUMENTOS_DEMO.map((d) => {
            const est = estadoDocumento(d.dias);
            return (
              <tr key={`${d.tipo}-${d.entidad}`} data-doc-row>
                <td className="py-2.5 pr-3 text-sm text-[var(--text-primary)]">{d.tipo}</td>
                <td className="py-2.5 pr-3 text-sm text-[var(--text-secondary)]">
                  <span className="t-label !text-[10px] mr-2">{d.entidadTipo}</span>
                  {d.entidad}
                </td>
                <td className="py-2.5 pr-3 t-mono text-xs text-[var(--text-muted)] hidden sm:table-cell">
                  {d.dias < 0 ? `hace ${-d.dias} días` : `en ${d.dias} días`}
                </td>
                <td className="py-2.5">
                  <span className="l-status" data-tone={est.tone}>
                    {est.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
