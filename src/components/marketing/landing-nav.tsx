"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#plataforma", label: "Plataforma" },
  { href: "#trazabilidad", label: "Trazabilidad" },
  { href: "#flota", label: "Flota" },
  { href: "#producto", label: "Producto" },
  { href: "#planes", label: "Planes" },
];

// Nav pública: transparente arriba de todo, superficie sólida con hairline
// al hacer scroll (sin glassmorphism). Resalta la sección visible.
export function LandingNav({ autenticado }: { autenticado: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState<string>("");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const targets = LINKS.map((l) => document.getElementById(l.href.slice(1))).filter((el): el is HTMLElement => !!el);
    // Se lleva el registro de qué secciones del menú están en la franja
    // central; si ninguna lo está (p. ej. "Conductores"), no se marca nada.
    const visibles = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visibles.add(e.target.id) : visibles.delete(e.target.id)));
        const first = LINKS.find((l) => visibles.has(l.href.slice(1)));
        setActive(first ? first.href : "");
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300",
        scrolled || open ? "bg-[var(--l-bg)]/95 border-[var(--l-line)]" : "bg-transparent border-transparent"
      )}
    >
      <div className="l-container h-16 flex items-center justify-between">
        <Link href="/" aria-label="TRAZA, inicio" className="rounded-sm">
          <Logo className="text-[var(--text-primary)]" />
        </Link>

        <nav aria-label="Secciones" className="hidden md:flex items-center gap-7">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-[13px] transition-colors",
                active === l.href ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
              aria-current={active === l.href ? "true" : undefined}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link href="/login" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            {autenticado ? "Ir a mi panel" : "Ingresar"}
          </Link>
          <Link href="/login" className="l-btn l-btn-primary !h-9 !px-4 !text-[13px]">
            Empezar
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="md:hidden p-2 -mr-2 rounded-md text-[var(--text-secondary)]"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" aria-label="Secciones" className="md:hidden border-t border-[var(--l-line)] l-container py-5 space-y-1">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-base text-[var(--text-secondary)]">
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-4">
            <Link href="/login" onClick={() => setOpen(false)} className="l-btn l-btn-ghost flex-1 justify-center">
              {autenticado ? "Ir a mi panel" : "Ingresar"}
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="l-btn l-btn-primary flex-1 justify-center">
              Empezar
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
