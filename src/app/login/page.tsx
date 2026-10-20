import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";
import { destinoSeguro } from "@/lib/safe-redirect";
import { Route, Wrench, QrCode, Truck } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#0f1522] text-white p-10 relative overflow-hidden">
        <Logo className="text-white" />
        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Todo bajo control.
          </h1>
          <p className="mt-3 text-white/70 text-sm leading-relaxed">
            TRAZA centraliza activos, mantenimiento, proveedores, documentación,
            flota y logística de tu empresa en una sola plataforma.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-white/80">
            <Feature icon={<QrCode className="h-4 w-4" />} label="QR por activo" />
            <Feature icon={<Wrench className="h-4 w-4" />} label="Mantenimiento" />
            <Feature icon={<Truck className="h-4 w-4" />} label="Flota y conductores" />
            <Feature icon={<Route className="h-4 w-4" />} label="Logística y costos" />
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} TRAZA
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ingresar a TRAZA</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-6">
            Accedé con tu cuenta para gestionar tus activos y operaciones.
          </p>
          <LoginForm next={destinoSeguro(next ?? "/dashboard")} />

          <div className="mt-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
              Cuenta demo — plataforma de prueba
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1 font-mono">
              <li>admin@traza.local / demo1234</li>
              <li>empresa@traza.local / demo1234</li>
              <li>tecnico@traza.local / demo1234</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">{icon}</span>
      {label}
    </div>
  );
}
