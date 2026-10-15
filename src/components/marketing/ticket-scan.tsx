"use client";

import { useRef } from "react";
import { ScanLine } from "lucide-react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";
import { TICKET_DEMO as TK } from "@/components/marketing/demo-data";

const ars = (n: number, d = 2) => n.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });

// Campos que el OCR del ticket precarga en el formulario de combustible
// (lib/scan-ticket-combustible.ts + parse-ticket-combustible.ts).
const CAMPOS = [
  { key: "estacion", label: "Estación", value: TK.estacion },
  { key: "litros", label: "Litros", value: `${ars(TK.litros)} L` },
  { key: "precio", label: "Precio por litro", value: `$ ${ars(TK.precioLitro)}` },
  { key: "importe", label: "Importe", value: `$ ${ars(TK.importe)}` },
];

export function TicketScan() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const hit = (key: string) => () => {
          root.current?.querySelectorAll<HTMLElement>(`[data-line="${key}"]`).forEach((l) => (l.dataset.hit = "true"));
        };
        const unhit = () => root.current?.querySelectorAll<HTMLElement>("[data-line]").forEach((l) => (l.dataset.hit = "false"));

        gsap.set("[data-value]", { autoAlpha: 0, x: -8 });
        gsap.set("[data-scan]", { yPercent: -100, autoAlpha: 0 });
        unhit();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
            onLeaveBack: unhit,
          },
        });
        tl.to("[data-scan]", { autoAlpha: 1, duration: 0.2 })
          .to("[data-scan]", { yPercent: 100, duration: 1.8, ease: "power1.inOut" }, 0)
          .to("[data-scan]", { autoAlpha: 0, duration: 0.3 }, 1.7);
        CAMPOS.forEach((c, i) => {
          const at = 0.45 + i * 0.3;
          tl.call(hit(c.key), undefined, at).to(`[data-field="${c.key}"] [data-value]`, { autoAlpha: 1, x: 0, duration: 0.4 }, at);
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="grid sm:grid-cols-2 gap-6 items-start">
      {/* Ticket */}
      <div className="relative mx-auto w-full max-w-[280px] sm:mx-0" aria-hidden="true">
        <div className="ticket px-5 pt-6 pb-7 rotate-[-1.5deg]" style={{ "--ticket-cut": "var(--l-bg)" } as React.CSSProperties}>
          <p className="ticket-hit text-center font-bold tracking-wider" data-line="estacion">YPF · RUTA 40</p>
          <p className="text-center text-[10px] opacity-70">ESTACIÓN DE SERVICIO</p>
          <p className="my-2 border-t border-dashed border-black/30" />
          <p className="flex justify-between"><span>FECHA</span><span>14/09 08:41</span></p>
          <p className="flex justify-between"><span>PATENTE</span><span>{TK.patente}</span></p>
          <p className="flex justify-between"><span>KM</span><span>{TK.km.toLocaleString("es-AR")}</span></p>
          <p className="my-2 border-t border-dashed border-black/30" />
          <p className="flex justify-between"><span>PRODUCTO</span><span>{TK.producto.toUpperCase()}</span></p>
          <p className="ticket-hit -mx-1 px-1 flex justify-between" data-line="litros"><span>LITROS</span><span>{ars(TK.litros)}</span></p>
          <p className="ticket-hit -mx-1 px-1 flex justify-between" data-line="precio"><span>$/L</span><span>{ars(TK.precioLitro)}</span></p>
          <p className="my-2 border-t border-dashed border-black/30" />
          <p className="ticket-hit -mx-1 px-1 flex justify-between font-bold" data-line="importe"><span>TOTAL</span><span>$ {ars(TK.importe)}</span></p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 overflow-hidden rotate-[-1.5deg]">
          <div data-scan className="ticket-scan h-full w-full" style={{ opacity: 0 }} />
        </div>
      </div>

      {/* Formulario precargado */}
      <div className="l-panel p-5">
        <p className="t-label mb-4 flex items-center gap-2">
          <ScanLine className="h-3.5 w-3.5 text-[var(--accent-hover)]" aria-hidden="true" /> Nueva carga · precargada
        </p>
        <dl className="space-y-3">
          {CAMPOS.map((c) => (
            <div key={c.key} data-field={c.key} className="ticket-hit rounded-[4px] border border-[var(--l-line)] px-3 py-2" data-line={c.key}>
              <dt className="t-label !text-[10px]">{c.label}</dt>
              <dd data-value className="mt-0.5 t-mono text-sm text-[var(--text-primary)]">
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          La lectura se hace en el navegador. Vos revisás los datos antes de guardar.
        </p>
      </div>
    </div>
  );
}
