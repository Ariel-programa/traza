import { SectionLabel } from "@/components/marketing/section-label";
import { EntityGraph } from "@/components/marketing/entity-graph";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

export function Plataforma() {
  return (
    <section id="plataforma" className="l-section border-t border-[var(--l-line)] bg-[var(--l-panel)]/40">
      <div className="l-container">
        <SectionLabel index="02">Plataforma</SectionLabel>
        <div className="grid lg:grid-cols-12 gap-8 mb-14 lg:mb-20">
          <TextReveal text="Un solo registro para toda la operación." className="t-h2 lg:col-span-7" />
          <Reveal className="lg:col-span-4 lg:col-start-9 self-end" delay={0.1}>
            <p className="t-body">
              Cada empresa tiene su propio espacio en TRAZA. Adentro, vehículos, conductores, traslados, gastos,
              documentos y cargas de combustible se relacionan entre sí. Tocá una entidad para ver qué guarda y con
              qué se conecta.
            </p>
          </Reveal>
        </div>
        <EntityGraph />
      </div>
    </section>
  );
}
