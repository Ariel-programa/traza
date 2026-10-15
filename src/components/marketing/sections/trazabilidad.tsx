import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { TrasladoTimeline } from "@/components/marketing/traslado-timeline";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

export function Trazabilidad() {
  return (
    <section id="trazabilidad" className="l-section">
      <div className="l-container">
        <SectionLabel index="03">Trazabilidad</SectionLabel>
        <div className="max-w-3xl mb-12 lg:mb-16">
          <TextReveal text="Un traslado, de la planificación a la llegada." className="t-h2" />
          <Reveal delay={0.1}>
            <p className="t-lead mt-6 max-w-xl">
              Cada viaje sabe qué vehículo lo hizo, quién manejó, cuánto costó y quién cambió cada estado. Seguilo con
              el scroll.
            </p>
          </Reveal>
        </div>
        <TrasladoTimeline />
        <div className="mt-8">
          <DemoNote />
        </div>
      </div>
    </section>
  );
}
