import Link from "next/link";
import { LogOut, Menu, Search } from "lucide-react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BackButton } from "@/components/layout/back-button";
import { QuickActions } from "@/components/layout/quick-actions";
import { CommandPaletteTrigger } from "@/components/layout/command-palette";
import type { Rol } from "@prisma/client";

const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  EMPRESA: "Empresa",
  PROVEEDOR: "Proveedor",
  TECNICO: "Técnico",
  CONDUCTOR: "Conductor",
};

export function Topbar({
  nombre,
  rol,
  empresa,
}: {
  nombre: string;
  rol: Rol;
  empresa?: string | null;
}) {
  return (
    <header className="glass h-14 shrink-0 flex items-center justify-between border-b border-[var(--border)] px-4 lg:px-6 relative z-30">
      <div className="flex items-center gap-3">
        <MobileNav rol={rol}>
          <button aria-label="Abrir menú" className="lg:hidden -ml-1 rounded-md p-1.5 hover:bg-[var(--surface-hover)]">
            <Menu className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden="true" />
          </button>
        </MobileNav>
        <BackButton />
        {empresa && (
          <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">{empresa}</span>
        )}
      </div>
      <div className="hidden md:flex flex-1 max-w-sm mx-4">
        <CommandPaletteTrigger />
      </div>
      <div className="flex items-center gap-3">
        <Link href="/buscar" className="md:hidden p-2 rounded-md hover:bg-[var(--surface-hover)]" aria-label="Buscar en TRAZA">
          <Search className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden="true" />
        </Link>
        <QuickActions rol={rol} />
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-tight">{nombre}</p>
          <p className="text-xs text-[var(--text-muted)] leading-tight">{ROL_LABEL[rol]}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent-hover)] flex items-center justify-center text-xs font-semibold">
          {nombre.slice(0, 2).toUpperCase()}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
