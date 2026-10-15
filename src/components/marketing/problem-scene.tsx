"use client";

import { useRef } from "react";
import { FileSpreadsheet, FileText, Mail, MessageCircle, NotebookPen, Receipt, StickyNote } from "lucide-react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";
import type { Tone } from "@/components/marketing/demo-data";

const FILAS: { icon: typeof FileText; antes: string; despues: string; detalle: string; tone: Tone }[] = [
  { icon: FileSpreadsheet, antes: "flota_2026_v7_FINAL.xlsx", despues: "Vehículo AD456FG", detalle: "Mercedes-Benz Sprinter · 61.870 km", tone: "success" },
  { icon: MessageCircle, antes: "“¿Quién lleva la Sprinter mañana?”", despues: "Traslado TR-0015", detalle: "Asignado a Hugo Farías · Planificado", tone: "info" },
  { icon: FileText, antes: "VTV_AD456FG_escaneo.pdf", despues: "Documento · VTV", detalle: "Vinculado a AD456FG · vence en 9 días", tone: "warning" },
  { icon: Receipt, antes: "Ticket de YPF en la guantera", despues: "Carga de combustible", detalle: "48,2 L · $ 48.778 · AF012JK", tone: "success" },
  { icon: StickyNote, antes: "Post-it: “renovar licencia Hugo”", despues: "Licencia de conducir", detalle: "Hugo Farías · vencida hace 3 días", tone: "danger" },
  { icon: Mail, antes: "“Te reenvío el gasto del peaje”", despues: "Gasto · Peaje", detalle: "Vinculado al traslado TR-0014", tone: "success" },
  { icon: NotebookPen, antes: "Kilómetros anotados en un cuaderno", despues: "Kilometraje del vehículo", detalle: "Actualizado en la ficha de AF012JK", tone: "success" },
];

// Posiciones de "desorden" (px, grados) para la escena desktop. Fijas, no
// aleatorias: el caos se ve igual en cada visita.
const SCATTER = [
  [-40, -150, -7],
  [260, -60, 5],
  [60, 110, -4],
  [320, 60, 8],
  [-10, 230, 6],
  [240, 180, -9],
  [120, -230, 3],
];

export function ProblemScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: escena fijada; el scroll ordena los fragmentos.
      mm.add(MQ.desktop, () => {
        // Se fija el bloque entero (texto + escena), no solo la lista
        const pinTarget = root.current?.closest<HTMLElement>("[data-pin]") ?? root.current;
        const frags = gsap.utils.toArray<HTMLElement>("[data-frag]");
        const links = gsap.utils.toArray<HTMLElement>("[data-link]");
        const dests = gsap.utils.toArray<HTMLElement>("[data-dest]");

        frags.forEach((f, i) => {
          const [x, y, r] = SCATTER[i % SCATTER.length];
          // Amontonados hacia el centro de la lista + desorden propio
          gsap.set(f, { x, y: (3 - i) * 30 + y * 0.6, rotate: r });
        });
        gsap.set(links, { scaleX: 0 });
        gsap.set(dests, { autoAlpha: 0.12, x: 24 });
        gsap.set("[data-dest-header]", { autoAlpha: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinTarget,
            pin: pinTarget,
            start: "top top+=104",
            end: "+=150%",
            scrub: 0.7,
            anticipatePin: 1,
          },
        });
        tl.to(frags, { x: 0, y: 0, rotate: 0, stagger: 0.06, duration: 1, ease: "power2.inOut" })
          .to("[data-dest-header]", { autoAlpha: 1, duration: 0.3 }, 0.8)
          .to(links, { scaleX: 1, stagger: 0.06, duration: 0.5, ease: "none" }, 0.9)
          .to(dests, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.5 }, 1)
          .to("[data-frag-text]", { opacity: 0.45, stagger: 0.04, duration: 0.4 }, 1.2);
      });

      // Tablet/mobile: sin pin, las filas entran en secuencia.
      mm.add(MQ.compact, () => {
        gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
          gsap.from(row.querySelectorAll("[data-frag], [data-link], [data-dest]"), {
            autoAlpha: 0,
            x: (i) => (i === 0 ? -20 : i === 2 ? 20 : 0),
            stagger: 0.12,
            duration: 0.7,
            scrollTrigger: { trigger: row, start: "top 88%", toggleActions: "play none none reverse" },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative">
      <div className="hidden md:grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] gap-x-2 pb-3 mb-2 border-b border-[var(--l-line)]">
        <p className="t-label">Dónde estaba</p>
        <span />
        <p data-dest-header className="t-label text-[var(--accent-hover)]">
          Dónde queda en TRAZA
        </p>
      </div>

      <ol className="divide-y divide-[var(--l-line)]">
        {FILAS.map((f) => (
          <li
            key={f.despues}
            data-row
            className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-x-2 gap-y-2 py-3.5"
          >
            <div data-frag className="relative z-10 flex items-center gap-3 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-[var(--l-line-strong)] bg-[var(--l-panel)] text-[var(--text-muted)]">
                <f.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span data-frag-text className="truncate text-sm text-[var(--text-secondary)]">
                <span className="sr-only">Antes: </span>
                {f.antes}
              </span>
            </div>

            <span data-link className="hidden md:block h-px origin-left bg-[var(--accent)]" aria-hidden="true" />

            <div data-dest className="flex items-baseline justify-between gap-4 min-w-0 pl-11 md:pl-0">
              <span className="min-w-0">
                <span className="sr-only">En TRAZA: </span>
                <span className="block text-sm font-medium text-[var(--text-primary)]">{f.despues}</span>
                <span className="block t-mono text-xs text-[var(--text-muted)] truncate">{f.detalle}</span>
              </span>
              <span className="l-status shrink-0" data-tone={f.tone} aria-hidden="true" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
