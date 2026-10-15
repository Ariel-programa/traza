"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "./gsap";

// Número que cuenta hasta `value` cuando entra en pantalla. El servidor ya
// renderiza el valor final (sin JS o con reduced-motion se ve correcto) y la
// animación escribe directo en el nodo: cero re-renders de React por frame.
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) =>
    `${prefix}${n.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const counter = { n: 0 };
        gsap.to(counter, {
          n: value,
          duration,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
          onUpdate: () => {
            el.textContent = format(counter.n);
          },
        });
        el.textContent = format(0);
        return () => {
          el.textContent = format(value);
        };
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
