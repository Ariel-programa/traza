import Link from "next/link";
import { SectionLabel } from "@/components/marketing/section-label";
import { Reveal } from "@/components/motion/reveal";

// Límites reales de cada plan (prisma/seed.ts, aplicados por lib de límites).
const PLANES = [
  { nombre: "Free", activos: 15, usuarios: 2, destacado: false },
  { nombre: "Profesional", activos: 150, usuarios: 8, destacado: true },
  { nombre: "Empresa", activos: 1000, usuarios: 50, destacado: false },
];

export function Planes() {
  return (
    <section id="planes" className="l-section !pb-12 border-t border-[var(--l-line)]">
      <div className="l-container">
        <SectionLabel index="09">Planes</SectionLabel>
        <div className="grid lg:grid-cols-12 gap-x-10 gap-y-10 items-end">
          <div className="lg:col-span-4 min-w-0">
            <p className="t-h3">Según el tamaño de tu operación.</p>
            <p className="t-body mt-3">
              Los planes se diferencian por cantidad de activos y de usuarios. Consultanos para elegir el adecuado.
            </p>
          </div>
          <Reveal className="lg:col-span-8 grid sm:grid-cols-3 border-t border-[var(--l-line-strong)]" stagger={0.08}>
            {PLANES.map((p) => (
              <div
                key={p.nombre}
                className={`relative py-6 sm:px-6 sm:first:pl-0 border-b sm:border-b-0 sm:border-l first:border-l-0 border-[var(--l-line)]`}
              >
                {p.destacado && <span className="absolute left-0 sm:left-6 right-0 -top-px h-px bg-[var(--accent)]" aria-hidden="true" />}
                <p className="text-base font-semibold">{p.nombre}</p>
                <p className="t-mono mt-4 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">{p.activos.toLocaleString("es-AR")}</span> activos
                </p>
                <p className="t-mono mt-1 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">{p.usuarios}</span> usuarios
                </p>
              </div>
            ))}
          </Reveal>
        </div>
        <div className="mt-8 lg:text-right">
          <Link href="/login" className="t-mono text-sm text-[var(--brand-hover)] hover:text-[var(--text-primary)] transition-colors">
            Consultar planes →
          </Link>
        </div>
      </div>
    </section>
  );
}
