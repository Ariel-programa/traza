"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";
import { TRASLADO_DEMO } from "@/components/marketing/demo-data";

// Visual del Hero: una red de rutas abstracta (no un mapa literal) con un
// traslado activo. Tres capas de profundidad:
//   [data-depth="1"] relieve/curvas de nivel (lejos)
//   [data-depth="2"] red de rutas y nodos
//   [data-depth="3"] traslado activo + etiquetas de datos (cerca)
// - Mouse (solo desktop): cada capa se desplaza distinto (parallax).
// - Scroll (scrub): el vehículo avanza por la ruta, la red se atenúa y las
//   etiquetas se van -- transición hacia la sección "Problema".
// - Entrada: CSS (.route-draw / .hero-fade), sin esperar al JS.

const NODES = [
  { id: "mza", x: 170, y: 372, label: "MENDOZA", coord: "32°53′S 68°50′O" },
  { id: "sj", x: 250, y: 150, label: "SAN JUAN" },
  { id: "sr", x: 250, y: 560, label: "SAN RAFAEL" },
  { id: "cba", x: 560, y: 200, label: "CÓRDOBA" },
  { id: "ros", x: 700, y: 360, label: "ROSARIO", coord: "32°57′S 60°39′O" },
  { id: "nqn", x: 90, y: 600, label: "NEUQUÉN" },
  { id: "sf", x: 690, y: 170, label: "SANTA FE" },
];

const NETWORK = [
  "M 170 372 C 190 290 220 220 250 150",
  "M 170 372 C 200 450 230 500 250 560",
  "M 250 560 C 190 580 130 590 90 600",
  "M 250 150 C 360 150 460 170 560 200",
  "M 560 200 C 610 190 650 180 690 170",
  "M 560 200 C 620 260 660 300 700 360",
  "M 250 560 C 400 520 560 430 700 360",
  "M 690 170 C 700 240 705 300 700 360",
];

// Traslado activo: Mendoza → Rosario (pasa por el corredor central)
const ACTIVE = "M 170 372 C 280 360 360 300 450 290 S 610 330 700 360";

const CONTOURS = [
  "M -20 120 C 120 80 260 140 400 100 S 680 40 820 90",
  "M -20 250 C 140 210 300 280 460 230 S 700 170 820 220",
  "M -20 470 C 160 430 320 500 480 450 S 720 400 820 440",
  "M -20 610 C 150 580 330 650 500 600 S 730 560 820 590",
];

export function HeroVisual() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const route = el.querySelector<SVGPathElement>("[data-active-route]");
      const trail = el.querySelector<SVGPathElement>("[data-trail]");
      const vehicle = el.querySelector<SVGGElement>("[data-vehicle]");
      if (!route || !trail || !vehicle) return;

      const total = route.getTotalLength();
      const place = (p: number) => {
        const pt = route.getPointAtLength(p * total);
        vehicle.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        trail.style.strokeDasharray = `${total}`;
        trail.style.strokeDashoffset = `${total * (1 - p)}`;
      };
      const state = { p: 0.34 };
      place(state.p);
      gsap.to(vehicle, { autoAlpha: 1, duration: 0.6, delay: 1.2 });

      const mm = gsap.matchMedia();

      // Scroll: el traslado avanza y la escena se "vacía" hacia la próxima sección
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top top+=80", end: "bottom top", scrub: 0.6 },
        });
        tl.to(state, { p: 0.97, ease: "none", onUpdate: () => place(state.p) }, 0)
          .to("[data-network]", { opacity: 0.25, ease: "none" }, 0)
          .to("[data-tag]", { autoAlpha: 0, y: -16, stagger: 0.08, ease: "none" }, 0.1);
      });

      // Mouse: parallax por capas (solo desktop con mouse)
      mm.add(MQ.desktop, () => {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", el);
        const movers = layers.map((layer) => {
          const depth = Number(layer.dataset.depth);
          return {
            depth,
            x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }),
            y: gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3.out" }),
          };
        });
        const onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => {
            m.x(nx * m.depth * 9);
            m.y(ny * m.depth * 7);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative w-full aspect-[800/640]" aria-hidden="true">
      {/* Capa 1 -- relieve */}
      <svg data-depth="1" viewBox="0 0 800 640" className="absolute inset-0 h-full w-full" fill="none">
        {CONTOURS.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className="route-draw"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            style={{ "--d": `${0.1 + i * 0.12}s` } as React.CSSProperties}
          />
        ))}
      </svg>

      {/* Capa 2 -- red de rutas y nodos */}
      <svg data-depth="2" data-network viewBox="0 0 800 640" className="absolute inset-0 h-full w-full" fill="none">
        {NETWORK.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className="route-draw"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.25"
            style={{ "--d": `${0.35 + i * 0.07}s` } as React.CSSProperties}
          />
        ))}
        {NODES.map((n, i) => (
          <g key={n.id} className="hero-fade" style={{ "--d": `${0.6 + i * 0.06}s` } as React.CSSProperties}>
            <rect x={n.x - 4} y={n.y - 4} width="8" height="8" fill="var(--l-bg)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.25" />
            <text x={n.x + 12} y={n.y - 8} className="hero-node-label">
              {n.label}
            </text>
            {n.coord && (
              <text x={n.x + 12} y={n.y + 18} className="hero-node-label" style={{ fontSize: 9.5, opacity: 0.7 }}>
                {n.coord}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Capa 3 -- traslado activo */}
      <svg data-depth="3" viewBox="0 0 800 640" className="absolute inset-0 h-full w-full" fill="none">
        <path d={ACTIVE} stroke="rgba(20,184,166,0.28)" strokeWidth="1.5" strokeDasharray="3 6" data-active-route />
        <path d={ACTIVE} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" data-trail style={{ strokeDasharray: "0 99999" }} />
        {/* Origen hueco / destino sólido: la gramática del isotipo */}
        <circle cx="170" cy="372" r="6" fill="var(--l-bg)" stroke="var(--accent)" strokeWidth="2.5" className="hero-fade" style={{ "--d": "0.9s" } as React.CSSProperties} />
        <g className="hero-fade" style={{ "--d": "1s" } as React.CSSProperties}>
          <circle cx="700" cy="360" r="7" fill="var(--accent)" className="l-pulse" />
          <circle cx="700" cy="360" r="6" fill="var(--accent)" />
        </g>
        <g data-vehicle style={{ opacity: 0, visibility: "hidden" }}>
          <circle r="16" fill="var(--accent)" opacity="0.14" />
          <circle r="6.5" fill="var(--l-bg)" stroke="var(--accent-hover)" strokeWidth="2.5" />
          <circle r="2.5" fill="var(--accent-hover)" />
        </g>
      </svg>

      {/* Etiquetas de datos (capa cercana) */}
      <div data-depth="4" className="absolute inset-0">
        <div data-tag className="hero-tag hero-in left-[2%] top-[4%]" style={{ "--d": "1.1s" } as React.CSSProperties}>
          <span className="t-label !text-[10px]">Traslado</span>
          <b>{TRASLADO_DEMO.numero}</b>
          <span>
            {TRASLADO_DEMO.origen} → {TRASLADO_DEMO.destino}
          </span>
          <span className="l-status mt-1" data-tone="info">
            En curso
          </span>
        </div>
        <div data-tag className="hero-tag hero-in left-[24%] top-[66%] hidden sm:flex" style={{ "--d": "1.25s" } as React.CSSProperties}>
          <span className="t-label !text-[10px]">Vehículo</span>
          <b>{TRASLADO_DEMO.vehiculo.patente}</b>
          <span>{TRASLADO_DEMO.vehiculo.modelo}</span>
        </div>
        <div data-tag className="hero-tag hero-in right-[3%] top-[62%]" style={{ "--d": "1.4s" } as React.CSSProperties}>
          <span className="t-label !text-[10px]">Conductora</span>
          <b>{TRASLADO_DEMO.conductor}</b>
          <span className="l-status" data-tone="success">
            Licencia vigente
          </span>
        </div>
        <div data-tag className="hero-tag hero-in right-[16%] top-[14%] hidden md:flex" style={{ "--d": "1.55s" } as React.CSSProperties}>
          <span className="t-label !text-[10px]">Gasto vinculado</span>
          <b>Peaje · $ 6.400</b>
          <span>{TRASLADO_DEMO.numero}</span>
        </div>
      </div>
    </div>
  );
}
