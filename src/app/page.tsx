import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { SectionIndicator } from "@/components/marketing/section-indicator";
import { Hero } from "@/components/marketing/sections/hero";
import { Problema } from "@/components/marketing/sections/problema";
import { Plataforma } from "@/components/marketing/sections/plataforma";
import { Trazabilidad } from "@/components/marketing/sections/trazabilidad";
import { Flota } from "@/components/marketing/sections/flota";
import { Conductores } from "@/components/marketing/sections/conductores";
import { Gastos } from "@/components/marketing/sections/gastos";
import { Documentacion } from "@/components/marketing/sections/documentacion";
import { Producto } from "@/components/marketing/sections/producto";
import { Planes } from "@/components/marketing/sections/planes";
import { CtaFinal } from "@/components/marketing/sections/cta-final";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

const DESCRIPTION =
  "TRAZA es el sistema de gestión para empresas de transporte y logística: vehículos, conductores, traslados, combustible, gastos y documentación en un mismo registro.";

export const metadata: Metadata = {
  title: "TRAZA — Gestión y trazabilidad para transporte y logística",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "TRAZA",
    title: "TRAZA — Controlá cada movimiento de tu operación",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "TRAZA — Controlá cada movimiento de tu operación",
    description: DESCRIPTION,
  },
};

// La historia de la landing, en orden: el problema → la plataforma → un
// traslado de punta a punta → cada pieza (flota, conductores, gastos,
// documentos) → el producto real → planes → cierre.
export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="landing min-h-screen">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <SmoothScroll />
      <LandingNav autenticado={!!session} />
      <main id="contenido">
        <Hero />
        <Problema />
        <Plataforma />
        <Trazabilidad />
        <Flota />
        <Conductores />
        <Gastos />
        <Documentacion />
        <Producto />
        <Planes />
        <CtaFinal autenticado={!!session} />
      </main>
      <LandingFooter />
      <SectionIndicator />
    </div>
  );
}
