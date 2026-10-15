"use client";

import { useState } from "react";
import { ESTADO_VEHICULO, FLOTA_DEMO, type EstadoVehiculo } from "@/components/marketing/demo-data";
import { CountUp } from "@/components/motion/count-up";

type Filtro = "TODOS" | EstadoVehiculo;

const FILTROS: Filtro[] = ["TODOS", "DISPONIBLE", "EN_VIAJE", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO"];

// Tablero de flota: tabla real (semántica), filtrable por los estados de
// EstadoVehiculo. El filtro atenúa en vez de quitar filas: la tabla no
// salta de alto y se entiende qué quedó afuera.
export function FleetBoard() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const count = (f: Filtro) => (f === "TODOS" ? FLOTA_DEMO.length : FLOTA_DEMO.filter((v) => v.estado === f).length);

  return (
    <div className="l-panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--l-line)] px-3 py-2.5" role="group" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <button key={f} type="button" className="l-tab" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {f === "TODOS" ? "Todos" : ESTADO_VEHICULO[f].label}
            <span className="ml-1.5 text-[var(--text-muted)]">{count(f)}</span>
          </button>
        ))}
      </div>

      <div className="overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-[640px] text-left">
          <caption className="sr-only">Flota de ejemplo con estado y próximo vencimiento</caption>
          <thead>
            <tr className="t-label !text-[10.5px] border-b border-[var(--l-line)]">
              <th scope="col" className="px-4 py-3 font-normal">Patente</th>
              <th scope="col" className="px-4 py-3 font-normal">Vehículo</th>
              <th scope="col" className="px-4 py-3 font-normal text-right">Km</th>
              <th scope="col" className="px-4 py-3 font-normal">Estado</th>
              <th scope="col" className="px-4 py-3 font-normal">Próximo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--l-line)]">
            {FLOTA_DEMO.map((v) => {
              const est = ESTADO_VEHICULO[v.estado];
              const dim = filtro !== "TODOS" && v.estado !== filtro;
              return (
                <tr key={v.patente} className="fleet-row" data-dim={dim}>
                  <td className="px-4 py-3">
                    <span className="plate">
                      <span>{v.patente}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-sm text-[var(--text-primary)]">{v.vehiculo}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{v.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-right t-mono text-[13px] text-[var(--text-secondary)]">
                    <CountUp value={v.km} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="l-status" data-tone={est.tone}>
                      {est.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="l-status" data-tone={v.proximo.tone}>
                      {v.proximo.texto}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
