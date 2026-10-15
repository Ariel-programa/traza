import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { TicketScan } from "@/components/marketing/ticket-scan";
import { ExpenseBars } from "@/components/marketing/expense-bars";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

export function Gastos() {
  return (
    <section id="gastos" className="l-section border-t border-[var(--l-line)]">
      <div className="l-container">
        <SectionLabel index="06">Gastos y combustible</SectionLabel>
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-8 mb-14 lg:mb-20">
          <TextReveal text="Cada peso, asociado a su vehículo y a su viaje." className="t-h2 lg:col-span-7" />
          <Reveal className="lg:col-span-4 lg:col-start-9 self-end" delay={0.1}>
            <p className="t-body">
              Combustible, peajes, mantenimiento, reparaciones, seguros y envíos quedan cargados con su categoría, su
              comprobante y el vehículo o traslado al que pertenecen. Así se sabe cuánto cuesta cada unidad y cada viaje.
            </p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10">
          <div className="lg:col-span-7 min-w-0">
            <p className="t-label mb-5">Tickets de combustible, sin tipear</p>
            <TicketScan />
          </div>
          <div className="lg:col-span-5 lg:pt-10 min-w-0">
            <ExpenseBars />
            <div className="mt-4">
              <DemoNote />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
