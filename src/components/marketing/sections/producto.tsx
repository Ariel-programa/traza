import { SectionLabel, DemoNote } from "@/components/marketing/section-label";
import { ProductTabs } from "@/components/marketing/product-tabs";
import { TextReveal } from "@/components/motion/text-reveal";
import { Reveal } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/parallax";

// Cada ítem es una capacidad existente en el código (roles de Prisma,
// AuditLog, QR públicos por activo, export CSV, webhooks/n8n, módulos del
// panel). Nada de cifras ni clientes.
const SPECS = [
  ["Multiempresa", "Cada empresa ve exclusivamente su información."],
  ["Roles", "Administrador, empresa, proveedor, técnico y conductor."],
  ["Auditoría", "Registro de quién creó, editó o eliminó cada dato."],
  ["QR por activo", "Ficha pública del activo al escanear su código."],
  ["Exportación", "Listados descargables en CSV."],
  ["Integraciones", "Webhooks por evento y conexión opcional con n8n."],
];

const MODULOS = ["Activos", "Mantenimiento", "Proveedores", "Impuestos", "Comodatos", "Monitoreo", "Reportes"];

export function Producto() {
  return (
    <section id="producto" className="l-section border-t border-[var(--l-line)] overflow-hidden">
      <div className="l-container">
        <SectionLabel index="08">El producto</SectionLabel>
        <div className="max-w-3xl mb-12">
          <TextReveal text="Así se ve TRAZA por dentro." className="t-h2" />
        </div>

        <Parallax speed={-0.08}>
          <Reveal depth={0.96} y={40}>
            <ProductTabs />
          </Reveal>
        </Parallax>
        <div className="mt-4">
          <DemoNote>Capturas reales del producto · datos de demostración</DemoNote>
        </div>

        <div className="mt-20 grid lg:grid-cols-12 gap-x-10 gap-y-10">
          <div className="lg:col-span-4 min-w-0">
            <p className="t-h3">Pensado para operar en serio.</p>
            <p className="t-body mt-3">
              Además de la operación de transporte, TRAZA cubre el resto del día a día de la empresa:
            </p>
            <p className="t-mono text-[13px] text-[var(--text-secondary)] mt-4 leading-7">{MODULOS.join(" · ")}</p>
          </div>
          <Reveal as="dl" className="lg:col-span-8 grid sm:grid-cols-2 gap-x-10" stagger={0.05}>
            {SPECS.map(([t, d]) => (
              <div key={t} className="flex gap-4 border-t border-[var(--l-line)] py-4">
                <dt className="t-label w-28 shrink-0 pt-0.5 !text-[var(--text-primary)]">{t}</dt>
                <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{d}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
