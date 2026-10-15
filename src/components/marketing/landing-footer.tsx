import Link from "next/link";
import { Logo } from "@/components/brand/logo";

// Solo enlaces reales: anclas de esta página e /login. Sin páginas legales
// ni de empresa que todavía no existen.
const SECCIONES = [
  { href: "#plataforma", label: "Plataforma" },
  { href: "#trazabilidad", label: "Trazabilidad" },
  { href: "#flota", label: "Flota" },
  { href: "#gastos", label: "Gastos y combustible" },
  { href: "#documentacion", label: "Documentación" },
  { href: "#producto", label: "Producto" },
  { href: "#planes", label: "Planes" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--l-line)]">
      <div className="l-container py-14 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo className="text-[var(--text-primary)]" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
            Gestión y trazabilidad para empresas de transporte y logística.
          </p>
        </div>
        <nav aria-label="Secciones de la página" className="md:col-span-4">
          <p className="t-label mb-4">Secciones</p>
          <ul className="grid grid-cols-2 gap-y-2 gap-x-6">
            {SECCIONES.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="t-label mb-4">Cuenta</p>
          <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Ingresar
          </Link>
        </div>
      </div>
      <div className="border-t border-[var(--l-line)]">
        <div className="l-container py-5 flex flex-wrap justify-between gap-3">
          <p className="t-mono text-xs text-[var(--text-muted)]">© {new Date().getFullYear()} TRAZA</p>
          <p className="t-mono text-xs text-[var(--text-muted)]">Todo bajo control.</p>
        </div>
      </div>
    </footer>
  );
}
