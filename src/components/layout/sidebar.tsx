"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, type NavItem } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import type { Rol } from "@prisma/client";

const COLLAPSE_KEY = "traza:sidebar-collapsed";

// Store mínimo sobre localStorage vía useSyncExternalStore -- evita el
// clásico "leer localStorage en un effect + setState" (mismatch de
// hidratación y setState síncrono en el cuerpo del effect). El snapshot en
// el servidor siempre es "expandido" para que el HTML de SSR y el primer
// render del cliente coincidan.
const collapseListeners = new Set<() => void>();
function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}
function getServerSnapshot() {
  return false;
}
function subscribeCollapsed(onChange: () => void) {
  collapseListeners.add(onChange);
  return () => collapseListeners.delete(onChange);
}
function setCollapsedStore(value: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // localStorage puede no estar disponible (modo privado, etc.) -- el
    // toggle sigue funcionando en memoria para esta sesión de pestaña.
  }
  collapseListeners.forEach((listener) => listener());
}

export function Sidebar({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTipo = searchParams.get("tipo");
  const collapsed = React.useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, getServerSnapshot);

  function toggle() {
    setCollapsedStore(!collapsed);
  }

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
  const groups = Array.from(new Set(items.map((item) => item.group)));

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-[var(--background)] border-r border-[var(--border)] transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className={cn("h-14 flex items-center border-b border-[var(--border)]", collapsed ? "justify-center px-2" : "px-5")}>
        <Logo mark className="text-[var(--text-primary)]" wordmark={!collapsed} />
      </div>
      <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-4">
        {groups.map((group, i) => (
          // Separador discreto entre las 4 grandes áreas de TRAZA (Operación
          // / Control / Información / Configuración) -- que la arquitectura
          // del producto se entienda mirando el menú, sin agregar texto.
          <div key={group} className={i > 0 ? "pt-3 border-t border-[var(--border)]" : undefined}>
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items
                .filter((item) => item.group === group)
                .map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} currentTipo={currentTipo} collapsed={collapsed} />
                ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-2">
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4 shrink-0" /> : <ChevronsLeft className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
  currentTipo,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  currentTipo: string | null;
  collapsed: boolean;
}) {
  const isBase = pathname === item.href;
  const isChildActive = item.children?.some((c) => {
    const [childPath, childQuery] = c.href.split("?");
    if (childQuery) {
      const params = new URLSearchParams(childQuery);
      return pathname === childPath && currentTipo === params.get("tipo");
    }
    return pathname === childPath && !currentTipo;
  });
  const active = isBase && !item.children ? true : isChildActive || (isBase && !currentTipo);
  const Icon = item.icon;

  return (
    <div>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors",
          collapsed ? "justify-center px-0" : "px-2.5",
          active
            ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-[var(--brand)]"
            aria-hidden="true"
          />
        )}
        <Icon className={cn("h-4 w-4 shrink-0", active && "text-[var(--brand-hover)]")} />
        {!collapsed && item.label}
      </Link>
      {!collapsed && item.children && (isBase || isChildActive) && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-3">
          {item.children.map((child) => {
            const [childPath, childQuery] = child.href.split("?");
            const params = childQuery ? new URLSearchParams(childQuery) : null;
            const childActive =
              pathname === childPath && (params ? currentTipo === params.get("tipo") : !currentTipo);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] transition-colors",
                  childActive
                    ? "text-[var(--brand-hover)] font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
