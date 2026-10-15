"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "./gsap";

// Parallax atado al scroll (scrub). `speed` positivo = el bloque se queda
// atrás (más lejos); negativo = avanza (más cerca). Solo desktop: en mobile
// y con reduced-motion el bloque queda quieto.
export function Parallax({
  children,
  className,
  speed = 0.15,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.desktop, () => {
        gsap.fromTo(
          ref.current,
          { yPercent: -speed * 50 },
          {
            yPercent: speed * 50,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
