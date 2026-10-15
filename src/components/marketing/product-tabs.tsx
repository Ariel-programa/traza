"use client";

import { useId, useState } from "react";
import Image from "next/image";

// Capturas reales del producto (public/landing/*) en pestañas accesibles
// (role=tablist, flechas del teclado para moverse).
const VISTAS = [
  {
    id: "dashboard",
    label: "Dashboard",
    src: "/landing/dashboard-preview.png",
    alt: "Dashboard de TRAZA con indicadores, centro de atención, flota, operación y gastos",
    texto: "Lo que requiere atención primero: vencimientos, mantenimiento, flota y costos.",
  },
  {
    id: "vencimientos",
    label: "Vencimientos",
    src: "/landing/vencimientos-preview.png",
    alt: "Centro de vencimientos de TRAZA con documentos ordenados por urgencia",
    texto: "Todo lo que vence, de vehículos, conductores y la empresa, ordenado por urgencia.",
  },
];

export function ProductTabs() {
  const [activa, setActiva] = useState(0);
  const base = useId();

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (activa + (e.key === "ArrowRight" ? 1 : -1) + VISTAS.length) % VISTAS.length;
    setActiva(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div role="tablist" aria-label="Vistas del producto" className="flex gap-1.5" onKeyDown={onKey}>
          {VISTAS.map((v, i) => (
            <button
              key={v.id}
              id={`${base}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={activa === i}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={activa === i ? 0 : -1}
              className="l-tab !text-[13px] !px-3.5 !py-2"
              onClick={() => setActiva(i)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{VISTAS[activa].texto}</p>
      </div>

      <div className="relative overflow-hidden rounded-[var(--l-radius-lg)] border border-[var(--l-line-strong)] bg-[var(--l-panel)]">
        <div className="flex h-9 items-center gap-3 border-b border-[var(--l-line)] px-4">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-[var(--l-line-strong)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--l-line-strong)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--l-line-strong)]" />
          </span>
          <span className="t-mono text-[11px] text-[var(--text-muted)]">traza / {VISTAS[activa].id}</span>
        </div>
        <div className="relative aspect-[3/2]">
          {VISTAS.map((v, i) => (
            <div
              key={v.id}
              id={`${base}-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`${base}-tab-${i}`}
              hidden={activa !== i}
              className="absolute inset-0"
            >
              <Image src={v.src} alt={v.alt} fill sizes="(min-width: 1320px) 1200px, 100vw" className="object-cover object-top" priority={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
