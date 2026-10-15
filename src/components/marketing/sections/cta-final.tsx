import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaRoute } from "@/components/marketing/cta-route";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";

export function CtaFinal({ autenticado }: { autenticado: boolean }) {
  return (
    <section id="empezar" className="l-section !pt-16 overflow-hidden">
      <div className="l-container">
        <CtaRoute />
        <div className="mt-10 grid lg:grid-cols-12 gap-x-10 gap-y-8 items-end">
          <TextReveal text="Tu operación, trazada de punta a punta." as="h2" className="t-display lg:col-span-8" />
          <Reveal className="lg:col-span-4" delay={0.15}>
            <p className="t-body">Empezá cargando tus vehículos y conductores. El resto se va conectando solo.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Magnetic>
                <Link href="/login" className="l-btn l-btn-primary">
                  {autenticado ? "Ir a mi panel" : "Empezar con TRAZA"}
                  <ArrowRight className="l-btn-arrow h-4 w-4" aria-hidden="true" />
                </Link>
              </Magnetic>
              {!autenticado && (
                <Magnetic>
                  <Link href="/login" className="l-btn l-btn-ghost">
                    Ingresar
                  </Link>
                </Magnetic>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
