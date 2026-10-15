import { SectionLabel } from "@/components/marketing/section-label";
import { ProblemScene } from "@/components/marketing/problem-scene";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";

export function Problema() {
  return (
    <section id="problema" className="l-section">
      <div className="l-container">
        <SectionLabel index="01">El problema</SectionLabel>
        <div data-pin className="grid lg:grid-cols-12 gap-x-8 gap-y-12">
          <div className="lg:col-span-5 min-w-0">
            <TextReveal text="Cuando la operación crece, la información se dispersa." className="t-h2" />
            <Reveal delay={0.15}>
              <p className="t-lead mt-6 max-w-md">
                Una planilla para la flota, un grupo de chat para los viajes, los tickets en una caja y los
                vencimientos en la memoria de alguien. Nadie tiene la foto completa.
              </p>
              <p className="t-body mt-5 max-w-md">
                TRAZA le da a cada dato un lugar y lo vincula con lo que corresponde: el ticket con el vehículo, el
                peaje con el viaje, la licencia con el conductor.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-7 min-w-0">
            <ProblemScene />
          </div>
        </div>
      </div>
    </section>
  );
}
