"use client";

import { Fragment, useRef, type ElementType } from "react";
import { gsap, MQ, useGSAP } from "./gsap";

// Títulos que entran palabra por palabra desde una máscara. El texto real
// queda en el DOM tal cual (las palabras son spans inline, sin aria-hidden),
// así que lectores de pantalla y buscadores leen la frase completa.
export function TextReveal({
  text,
  as: Tag = "h2",
  className,
  start = "top 85%",
}: {
  text: string;
  as?: ElementType;
  className?: string;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap.from("[data-word]", {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.045,
          ease: "power4.out",
          scrollTrigger: { trigger: ref.current, start, toggleActions: "play none none reverse" },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        // El espacio va fuera de la máscara inline-block: adentro se colapsa
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-top">
            <span data-word className="inline-block">
              {w}
            </span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </Tag>
  );
}
