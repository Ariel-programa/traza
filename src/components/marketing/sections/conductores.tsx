import { IdCard } from "lucide-react";
import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { TRASLADO_DEMO as T, TICKET_DEMO } from "@/components/marketing/demo-data";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";
import { Tilt } from "@/components/motion/tilt";

const PUNTOS = [
  "Licencia con su fecha de vencimiento, y los documentos del conductor en su ficha.",
  "Los traslados que manejó y las cargas de combustible que hizo.",
  "Usuario propio con rol Conductor: consulta los traslados y registra las cargas de combustible desde el celular.",
];

export function Conductores() {
  return (
    <section id="conductores" className="l-section bg-[var(--l-panel)]/40 border-t border-[var(--l-line)]">
      <div className="l-container grid lg:grid-cols-12 gap-x-10 gap-y-14 items-center">
        {/* Credencial */}
        <Reveal className="lg:col-span-5 order-2 lg:order-1" depth={0.94} y={40}>
          <Tilt className="max-w-[420px] mx-auto lg:mx-0">
            <article className="l-panel overflow-hidden" aria-label="Ejemplo de ficha de conductor">
              <div className="flex items-center justify-between border-b border-[var(--l-line)] px-5 py-3">
                <span className="t-label flex items-center gap-2">
                  <IdCard className="h-3.5 w-3.5" aria-hidden="true" /> Conductora
                </span>
                <span className="l-status" data-tone="success">
                  Activa
                </span>
              </div>
              <div className="px-5 py-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[var(--l-radius)] bg-[var(--l-panel-2)] border border-[var(--l-line-strong)] t-mono text-sm text-[var(--text-secondary)]">
                    LB
                  </span>
                  <div>
                    <p className="text-lg font-semibold leading-tight">{T.conductor}</p>
                    <p className="t-mono text-xs text-[var(--text-muted)] mt-0.5">Licencia LIC-0002</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <span className="t-label !text-[10.5px]">Licencia</span>
                    <span className="t-mono text-xs text-[var(--text-secondary)]">vence en 168 días</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-[var(--l-line)] overflow-hidden">
                    <div className="h-full w-[46%] bg-[var(--success)]" />
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--l-radius)] border border-[var(--l-line)] bg-[var(--l-line)]">
                  {[
                    ["Traslado actual", `${T.numero} · En curso`],
                    ["Vehículo", `${T.vehiculo.patente}`],
                    ["Última carga", `${TICKET_DEMO.litros.toLocaleString("es-AR")} L · ${TICKET_DEMO.estacion}`],
                    ["Documentos", "Licencia · vigente"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-[var(--l-panel)] px-3.5 py-3">
                      <dt className="t-label !text-[10px]">{k}</dt>
                      <dd className="mt-1 text-[13px] text-[var(--text-primary)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          </Tilt>
          <div className="mt-4 max-w-[420px] mx-auto lg:mx-0">
            <DemoNote />
          </div>
        </Reveal>

        {/* Texto */}
        <div className="lg:col-span-6 lg:col-start-7 order-1 lg:order-2 min-w-0">
          <SectionLabel index="05">Conductores</SectionLabel>
          <TextReveal text="Quién maneja, con qué licencia y hasta cuándo." className="t-h2" />
          <Reveal as="ul" className="mt-10 space-y-4" stagger={0.08}>
            {PUNTOS.map((p) => (
              <li key={p} className="flex gap-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                <span className="mt-[0.7em] h-px w-5 shrink-0 bg-[var(--accent)]" aria-hidden="true" />
                {p}
              </li>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
