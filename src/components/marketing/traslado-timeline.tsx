"use client";

import { useRef } from "react";
import { Truck } from "lucide-react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { TRASLADO_DEMO as T } from "@/components/marketing/demo-data";

// Etapas del traslado, fieles a la lógica real (logistica/actions.ts):
// al pasar a EN_CURSO el vehículo queda EN_VIAJE, al completarlo vuelve a
// DISPONIBLE, y cada cambio se registra en la auditoría.
const ETAPAS = [
  {
    estado: "Planificado",
    titulo: "Se crea el traslado",
    texto: `${T.numero}: ${T.origen} → ${T.destino}, para ${T.cliente}.`,
    log: [`CREAR · Traslado · ${T.numero}`],
  },
  {
    estado: "Asignado",
    titulo: "Vehículo y conductora",
    texto: `${T.vehiculo.modelo} ${T.vehiculo.patente} con ${T.conductor}. Desde el traslado se abre la ficha de cada uno, con su documentación.`,
    log: [`Vehículo ${T.vehiculo.patente} · Conductora ${T.conductor}`],
  },
  {
    estado: "En curso",
    titulo: "Sale a la ruta",
    texto: "Al marcarlo en curso, el vehículo pasa solo a “En viaje” en la flota.",
    log: [`EDITAR · Traslado · estado → EN_CURSO`, `Vehículo ${T.vehiculo.patente} → EN_VIAJE`],
  },
  {
    estado: "Gastos",
    titulo: "Lo que cuesta el viaje",
    texto: "El peaje se carga como gasto del traslado; la carga de combustible queda en el vehículo y la conductora.",
    log: [`Gasto · Peaje · $ 6.400 · ${T.numero}`, `Combustible · 48,2 L · ${T.vehiculo.patente}`],
  },
  {
    estado: "Completado",
    titulo: "Llega a destino",
    texto: "Al completarlo, el vehículo vuelve a “Disponible”. El viaje queda con sus gastos en el historial.",
    log: [`EDITAR · Traslado · estado → COMPLETADO`, `Vehículo ${T.vehiculo.patente} → DISPONIBLE`],
  },
];

export function TrasladoTimeline() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const stops = gsap.utils.toArray<HTMLElement>("[data-stop]", el);
      const logs = gsap.utils.toArray<HTMLElement>("[data-log]", el);
      let last = -1;
      const setReached = (p: number) => {
        const n = Math.min(ETAPAS.length - 1, Math.floor(p * (ETAPAS.length - 1) + 0.02));
        if (n === last) return;
        last = n;
        stops.forEach((s, i) => (s.dataset.reached = i <= n ? "true" : "false"));
        logs.forEach((l) => (l.dataset.reached = Number(l.dataset.step) <= n ? "true" : "false"));
      };

      const mm = gsap.matchMedia();

      // Desktop: se fija la escena y el scroll mueve el vehículo por la línea.
      mm.add(MQ.desktop, () => {
        setReached(0);
        const track = el.querySelector<HTMLElement>("[data-track]")!;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            pin: true,
            start: "top top+=96",
            end: "+=180%",
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => setReached(self.progress),
          },
        });
        tl.fromTo("[data-progress]", { scaleX: 0 }, { scaleX: 1, ease: "none" }, 0).fromTo(
          "[data-vehicle]",
          { x: 0 },
          { x: () => track.offsetWidth, ease: "none" },
          0
        );
        return () => {
          last = -1;
        };
      });

      // Tablet/mobile: línea vertical que se llena con el scroll, sin pin.
      mm.add(MQ.compact, () => {
        setReached(0);
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 60%",
          end: "bottom 60%",
          scrub: true,
          onUpdate: (self) => setReached(self.progress),
        });
        const fill = gsap.fromTo(
          "[data-progress-v]",
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 60%", scrub: true } }
        );
        return () => {
          st.kill();
          fill.kill();
          last = -1;
        };
      });

      // Reduced motion: todo marcado como alcanzado (estado final visible).
      mm.add("(prefers-reduced-motion: reduce)", () => {
        last = -1;
        setReached(1);
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="traslado-timeline relative">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Recorrido */}
        <div className="lg:col-span-8">
          {/* Línea horizontal (desktop) */}
          <div className="relative hidden lg:block h-14 mb-8" aria-hidden="true">
            <div data-track className="absolute left-[10%] right-[10%] top-1/2 h-px bg-[var(--l-line-strong)]">
              <div data-progress className="absolute inset-0 origin-left bg-[var(--accent)]" style={{ transform: "scaleX(1)" }} />
              <div data-vehicle className="absolute -top-[15px] -left-[15px]">
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--l-bg)] text-[var(--accent-hover)]">
                  <Truck className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>

          <ol className="relative grid lg:grid-cols-5 gap-y-8 lg:gap-x-4 pl-8 lg:pl-0">
            {/* Línea vertical (mobile/tablet) */}
            <span className="lg:hidden absolute left-[7px] top-2 bottom-2 w-px bg-[var(--l-line-strong)]" aria-hidden="true">
              <span data-progress-v className="absolute inset-0 origin-top bg-[var(--accent)]" style={{ transform: "scaleY(1)" }} />
            </span>

            {ETAPAS.map((e, i) => (
              <li key={e.estado} data-stop data-reached="true" className="timeline-stop relative lg:text-center">
                <span
                  className="timeline-dot absolute -left-8 top-0.5 lg:static lg:mx-auto lg:mb-4 flex h-[15px] w-[15px] items-center justify-center rounded-full border-2 bg-[var(--l-bg)]"
                  aria-hidden="true"
                />
                <p className="t-label !text-[10.5px]">
                  {String(i + 1).padStart(2, "0")} · {e.estado}
                </p>
                <h3 className="mt-2 text-[15px] font-semibold text-[var(--text-primary)]">{e.titulo}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{e.texto}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Registro de auditoría que se va escribiendo */}
        <div className="lg:col-span-4">
          <div className="l-panel h-full p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="t-label">Historial · {T.numero}</p>
              <span className="t-label !text-[10px]">Auditoría</span>
            </div>
            <ul className="space-y-2.5">
              {ETAPAS.flatMap((e, i) =>
                e.log.map((line) => (
                  <li key={line} data-log data-step={i} data-reached="true" className="timeline-log t-mono text-[12px] leading-snug flex gap-2.5">
                    <span className="text-[var(--text-muted)] tabular-nums shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[var(--text-secondary)]">{line}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
