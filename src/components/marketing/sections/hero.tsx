import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { Magnetic } from "@/components/motion/magnetic";

const HEADLINE = ["Controlá", "cada", "movimiento", "de", "tu", "operación."];

// Server Component. La entrada (palabras que suben, fades) es CSS puro para
// que se vea desde el primer paint; el único Client Component es el visual.
export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="hero-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="l-container relative grid lg:grid-cols-12 gap-y-12 gap-x-8 items-center pt-32 pb-16 sm:pt-36 lg:pt-40 lg:pb-24 lg:min-h-[92svh]">
        <div className="lg:col-span-6 xl:col-span-5 min-w-0">
          <p className="t-label hero-in mb-7 flex items-center gap-2.5" style={{ "--d": "0.05s" } as React.CSSProperties}>
            <span className="h-2 w-2 rounded-full border-2 border-[var(--accent)]" aria-hidden="true" />
            Gestión y trazabilidad para transporte y logística
          </p>

          <h1 className="t-display">
            {HEADLINE.map((w, i) => (
              // El espacio va fuera de la máscara inline-block: adentro se colapsa
              <Fragment key={i}>
                <span className="hero-word-mask">
                  <span
                    className={`hero-word ${w === "movimiento" ? "text-[var(--accent-hover)]" : ""}`}
                    style={{ "--d": `${0.12 + i * 0.07}s` } as React.CSSProperties}
                  >
                    {w}
                  </span>
                </span>
                {i < HEADLINE.length - 1 && " "}
              </Fragment>
            ))}
          </h1>

          <p className="t-lead hero-in mt-7 max-w-[34rem]" style={{ "--d": "0.55s" } as React.CSSProperties}>
            TRAZA es el sistema de gestión para empresas de transporte y logística. Vehículos, conductores, traslados,
            combustible, gastos y documentación en un mismo registro, vinculados entre sí.
          </p>

          <div className="hero-in mt-10 flex flex-wrap items-center gap-3" style={{ "--d": "0.7s" } as React.CSSProperties}>
            <Magnetic>
              <Link href="/login" className="l-btn l-btn-primary">
                Empezar con TRAZA
                <ArrowRight className="l-btn-arrow h-4 w-4" aria-hidden="true" />
              </Link>
            </Magnetic>
            <Magnetic>
              <a href="#trazabilidad" className="l-btn l-btn-ghost">
                Ver un traslado completo
              </a>
            </Magnetic>
          </div>

          <dl
            className="hero-in mt-14 grid grid-cols-3 max-w-[30rem] border-t border-[var(--l-line)]"
            style={{ "--d": "0.85s" } as React.CSSProperties}
          >
            {[
              ["Multiempresa", "Cada empresa ve solo sus datos"],
              ["Roles", "Admin, empresa, conductor y más"],
              ["Auditoría", "Quién cambió qué y cuándo"],
            ].map(([t, d]) => (
              <div key={t} className="pt-4 pr-4">
                <dt className="text-sm font-medium text-[var(--text-primary)]">{t}</dt>
                <dd className="mt-1 text-xs leading-snug text-[var(--text-muted)]">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 xl:col-span-7 lg:-mr-[6vw] min-w-0">
          <HeroVisual />
          <p className="t-label !text-[10px] mt-2 text-right pr-2">Vista ilustrativa · datos de demostración</p>
        </div>
      </div>
    </section>
  );
}
