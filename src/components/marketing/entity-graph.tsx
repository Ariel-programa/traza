"use client";

import { useRef, useState } from "react";
import { Building2, FileText, Fuel, Receipt, Route, Truck, UserRound } from "lucide-react";
import { gsap, MQ, useGSAP } from "@/components/motion/gsap";

type EntityId = "vehiculos" | "conductores" | "traslados" | "gastos" | "documentos" | "combustible";

// Campos y relaciones tomados de prisma/schema.prisma -- lo que el sistema
// realmente guarda, no una lista de marketing.
const ENTIDADES: {
  id: EntityId;
  nombre: string;
  icon: typeof Truck;
  campos: string[];
  relaciones: EntityId[];
  nota: string;
}[] = [
  {
    id: "vehiculos",
    nombre: "Vehículos",
    icon: Truck,
    campos: ["Patente", "Marca y modelo", "Tipo", "Kilometraje", "Estado", "Próximo service", "VTV", "Seguro", "Última ubicación"],
    relaciones: ["documentos", "traslados", "combustible", "gastos"],
    nota: "La ubicación se actualiza desde el celular con un toque; no requiere GPS instalado.",
  },
  {
    id: "conductores",
    nombre: "Conductores",
    icon: UserRound,
    campos: ["Nombre y apellido", "Documento", "Licencia", "Vencimiento de licencia", "Teléfono", "Estado"],
    relaciones: ["documentos", "traslados", "combustible"],
    nota: "Un conductor puede tener su propio usuario con rol Conductor.",
  },
  {
    id: "traslados",
    nombre: "Traslados",
    icon: Route,
    campos: ["Número", "Fecha", "Origen", "Destino", "Cliente", "Estado", "Observaciones"],
    relaciones: ["vehiculos", "conductores", "gastos"],
    nota: "Estados: planificado, en curso, completado o cancelado.",
  },
  {
    id: "gastos",
    nombre: "Gastos",
    icon: Receipt,
    campos: ["Fecha", "Categoría", "Importe", "Proveedor", "Comprobante", "Observaciones"],
    relaciones: ["vehiculos", "traslados"],
    nota: "Combustible, peaje, mantenimiento, reparación, envío, seguro u otros.",
  },
  {
    id: "documentos",
    nombre: "Documentos",
    icon: FileText,
    campos: ["Tipo", "Número", "Emisión", "Vencimiento", "Archivo", "Estado"],
    relaciones: ["vehiculos", "conductores"],
    nota: "También se asocian a activos, proveedores o a la empresa.",
  },
  {
    id: "combustible",
    nombre: "Combustible",
    icon: Fuel,
    campos: ["Fecha", "Estación", "Litros", "Precio por litro", "Importe", "Kilometraje", "Foto del ticket"],
    relaciones: ["vehiculos", "conductores"],
    nota: "La foto del ticket se lee con OCR y precarga los datos para que los confirmes.",
  },
];

export function EntityGraph() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<EntityId>("traslados");
  const actual = ENTIDADES.find((e) => e.id === selected)!;

  // El "bus" que baja desde Empresa y se reparte a cada entidad se dibuja
  // con el scroll; las entidades aparecen detrás.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 75%", toggleActions: "play none none reverse" },
        });
        tl.from("[data-root-node]", { autoAlpha: 0, y: 16, duration: 0.6 })
          .from("[data-trunk]", { scaleY: 0, duration: 0.5, ease: "power2.inOut" }, "-=0.2")
          .from("[data-bus]", { scaleX: 0, duration: 0.7, ease: "power2.inOut" }, "-=0.1")
          .from("[data-stem]", { scaleY: 0, stagger: 0.05, duration: 0.3 }, "-=0.35")
          .from("[data-entity]", { autoAlpha: 0, y: 14, stagger: 0.06, duration: 0.5 }, "-=0.35")
          .from("[data-detail]", { autoAlpha: 0, y: 20, duration: 0.6 }, "-=0.3");
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="entity-graph" data-has-selection>
      {/* Nodo raíz: Empresa */}
      <div className="flex flex-col items-center">
        <div data-root-node className="l-panel flex items-center gap-3 px-4 py-3">
          <Building2 className="h-4.5 w-4.5 text-[var(--accent-hover)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Empresa</p>
            <p className="t-mono text-[11px] text-[var(--text-muted)]">Datos aislados por empresa</p>
          </div>
        </div>
        <span data-trunk className="block h-8 w-px origin-top bg-[var(--l-line-strong)]" aria-hidden="true" />
      </div>

      {/* Entidades */}
      <div className="relative">
        <span data-bus className="absolute left-[8.33%] right-[8.33%] top-0 hidden lg:block h-px origin-center bg-[var(--l-line-strong)]" aria-hidden="true" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 lg:gap-3 lg:pt-8" role="group" aria-label="Entidades de TRAZA">
          {ENTIDADES.map((e) => {
            const isSel = e.id === selected;
            const related = actual.relaciones.includes(e.id);
            return (
              // GSAP anima el wrapper: el botón tiene transición CSS de opacidad
              // (para atenuar) y ambas cosas sobre el mismo nodo se pisan.
              <div key={e.id} data-entity className="flex">
                <button
                  type="button"
                  onClick={() => setSelected(e.id)}
                  aria-pressed={isSel}
                  data-related={related || undefined}
                  className="entity-btn w-full px-3.5 py-3.5"
                >
                  <span data-stem className="entity-stem absolute left-1/2 -top-8 hidden lg:block h-8 w-px origin-top bg-[var(--l-line-strong)]" aria-hidden="true" />
                  <e.icon className={`h-4.5 w-4.5 ${isSel || related ? "text-[var(--accent-hover)]" : "text-[var(--text-muted)]"}`} aria-hidden="true" />
                  <span className="mt-3 block text-sm font-medium text-[var(--text-primary)]">{e.nombre}</span>
                  <span className="t-mono block text-[10.5px] text-[var(--text-muted)] mt-0.5">
                    {isSel ? "seleccionado" : related ? "vinculado" : `${e.campos.length} campos`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle de la entidad seleccionada */}
      <div data-detail className="mt-6 grid md:grid-cols-12 gap-px overflow-hidden rounded-[var(--l-radius-lg)] border border-[var(--l-line)] bg-[var(--l-line)]" aria-live="polite">
        <div className="md:col-span-7 bg-[var(--l-panel)] p-5 sm:p-6">
          <p className="t-label mb-4">Qué registra · {actual.nombre}</p>
          <ul className="flex flex-wrap gap-1.5">
            {actual.campos.map((c) => (
              <li key={c} className="t-mono text-xs rounded-[4px] border border-[var(--l-line-strong)] px-2 py-1 text-[var(--text-secondary)]">
                {c}
              </li>
            ))}
          </ul>
          <p className="t-body !text-sm mt-5">{actual.nota}</p>
        </div>
        <div className="md:col-span-5 bg-[var(--l-panel)] p-5 sm:p-6">
          <p className="t-label mb-4">Se vincula con</p>
          <ul className="space-y-2">
            {actual.relaciones.map((r) => {
              const rel = ENTIDADES.find((e) => e.id === r)!;
              return (
                <li key={r} className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                  <span className="h-px w-6 bg-[var(--accent)]" aria-hidden="true" />
                  <rel.icon className="h-4 w-4 text-[var(--accent-hover)]" aria-hidden="true" />
                  {rel.nombre}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
