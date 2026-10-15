"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, MQ, useGSAP } from "./gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Desplazamiento vertical inicial en px. */
  y?: number;
  /** Profundidad: escala inicial (<1 = entra "desde atrás"). */
  depth?: number;
  delay?: number;
  /** Animar los hijos directos uno tras otro en vez del bloque entero. */
  stagger?: number | false;
  /** Punto de disparo de ScrollTrigger. */
  start?: string;
};

// Reveal al hacer scroll: el contenido SIEMPRE se renderiza visible desde el
// servidor; GSAP recién lo lleva al estado inicial una vez hidratado (y solo
// si no hay reduced-motion). Si el JS falla, no se pierde nada. Reversible
// al volver a subir.
export function Reveal({
  children,
  className,
  as: Tag = "div",
  y = 28,
  depth = 1,
  delay = 0,
  stagger = false,
  start = "top 86%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const targets = stagger !== false ? Array.from(el.children) : el;
        gsap.from(targets, {
          autoAlpha: 0,
          y,
          scale: depth,
          duration: 0.9,
          delay,
          stagger: stagger || 0,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start, toggleActions: "play none none reverse" },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
