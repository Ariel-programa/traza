"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import type { Rol } from "@prisma/client";

export function MobileNav({ rol, children }: { rol: Rol; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));
  const groups = Array.from(new Set(items.map((item) => item.group)));
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="glass absolute left-0 top-0 h-full w-72 shadow-[var(--shadow-lg)] flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
              <Logo />
              <button
                ref={closeButtonRef}
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="p-1.5 rounded-md hover:bg-[var(--surface-hover)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-4">
              {groups.map((group) => (
                <div key={group}>
                  <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items
                      .filter((item) => item.group === group)
                      .map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
