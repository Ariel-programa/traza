"use client";

// Punto único de entrada a GSAP para toda la landing: registra los plugins
// una sola vez y define las condiciones de motion compartidas. Ningún
// componente importa "gsap" directo -- todos pasan por acá, así las reglas
// (reduced-motion, desktop vs. mobile) se deciden en un solo lugar.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
}

/** Condiciones para gsap.matchMedia(). */
export const MQ = {
  /** Cualquier animación: el usuario no pidió reducir movimiento. */
  motion: "(prefers-reduced-motion: no-preference)",
  /** Escenas costosas (pinning, parallax, cursor): desktop con mouse. */
  desktop: "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (pointer: fine)",
  /** Versión simplificada para tablet/mobile. */
  compact: "(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)",
} as const;

export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  expo: "expo.out",
} as const;

export { gsap, ScrollTrigger, useGSAP };
