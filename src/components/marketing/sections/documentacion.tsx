import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { ExpiryRuler } from "@/components/marketing/expiry-ruler";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

export function Documentacion() {
  return (
    <section id="documentacion" className="l-section bg-[var(--l-panel)]/40 border-t border-[var(--l-line)]">
      <div className="l-container">
        <SectionLabel index="07">Documentación</SectionLabel>
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-12">
          <div className="lg:col-span-4 min-w-0">
            <TextReveal text="Cada papel, pegado a lo que respalda." className="t-h2" />
            <Reveal delay={0.1}>
              <p className="t-body mt-6">
                VTV, seguros, licencias y habilitaciones se cargan sobre el vehículo, el conductor, el activo, el
                proveedor o la empresa a la que pertenecen, con su archivo y su fecha de vencimiento.
              </p>
              <p className="t-body mt-4">
                El estado se calcula por fecha: vigente, próximo a vencer o vencido. El centro de vencimientos los
                ordena por urgencia.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-8 min-w-0">
            <ExpiryRuler />
            <div className="mt-5">
              <DemoNote />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
