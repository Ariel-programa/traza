import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { FleetBoard } from "@/components/marketing/fleet-board";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

const PUNTOS = [
  ["Estado real", "Disponible, en viaje, en mantenimiento o fuera de servicio. Los traslados lo actualizan solos."],
  ["Vencimientos", "Service, VTV y seguro de cada unidad aparecen en el centro de vencimientos antes de que venzan."],
  ["Historial", "Traslados, cargas de combustible, gastos y documentos de cada vehículo en su ficha."],
];

export function Flota() {
  return (
    <section id="flota" className="l-section border-t border-[var(--l-line)]">
      <div className="l-container grid lg:grid-cols-12 gap-x-10 gap-y-12">
        <div className="lg:col-span-4 min-w-0">
          <SectionLabel index="04">Flota</SectionLabel>
          <TextReveal text="Cada unidad, con su estado real." className="t-h2" />
          <Reveal as="dl" className="mt-10 space-y-6" stagger={0.08}>
            {PUNTOS.map(([t, d]) => (
              <div key={t} className="border-l border-[var(--l-line-strong)] pl-4">
                <dt className="text-sm font-medium text-[var(--text-primary)]">{t}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{d}</dd>
              </div>
            ))}
          </Reveal>
        </div>
        <div className="lg:col-span-8 lg:pt-16 min-w-0">
          <Reveal depth={0.97}>
            <FleetBoard />
          </Reveal>
          <div className="mt-4">
            <DemoNote />
          </div>
        </div>
      </div>
    </section>
  );
}
