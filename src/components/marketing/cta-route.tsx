"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";

// Cierre de la historia: la ruta que arrancó en el Hero termina acá. Se
// dibuja con el scroll y llega a un punto sólido -- el punto de llegada
// del isotipo.
export function CtaRoute() {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 30%", scrub: 0.5 },
        });
        tl.fromTo("[data-cta-path]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none" })
          .fromTo("[data-cta-end]", { scale: 0 }, { scale: 1, transformOrigin: "center", ease: "back.out(3)", duration: 0.15 });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <svg ref={root} viewBox="0 0 1200 120" className="w-full h-auto" fill="none" aria-hidden="true">
      <circle cx="12" cy="92" r="6" fill="var(--l-bg)" stroke="var(--accent)" strokeWidth="2.5" />
      <path
        data-cta-path
        d="M 20 92 C 220 92 300 30 520 38 S 820 100 980 70 S 1120 30 1180 26"
        pathLength={1}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="1"
        strokeLinecap="round"
      />
      <circle data-cta-end cx="1182" cy="26" r="7" fill="var(--accent)" style={{ transformBox: "fill-box" }} />
    </svg>
  );
}
