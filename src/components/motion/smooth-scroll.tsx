"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, MQ, ScrollTrigger } from "./gsap";

// Smooth scroll con Lenis, sincronizado con el ticker de GSAP para que
// ScrollTrigger lea la misma posición en cada frame. Solo en desktop con
// mouse y sin reduced-motion: en touch el scroll nativo es mejor, y con
// reduced-motion el scroll tiene que ser instantáneo.
export function SmoothScroll() {
  useEffect(() => {
    if (!window.matchMedia(MQ.desktop).matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      anchors: { offset: -72 },
      // Contenedores con scroll propio (tablas, listas) conservan el nativo
      prevent: (node) => node.closest?.("[data-lenis-prevent]") !== null,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
