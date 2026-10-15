"use client";

import { Button } from "@/components/ui/button";
import { updateEstadoTraslado } from "./actions";
import type { EstadoTraslado } from "@prisma/client";

const OPCIONES: { estado: EstadoTraslado; label: string }[] = [
  { estado: "PLANIFICADO", label: "Planificado" },
  { estado: "EN_CURSO", label: "En curso" },
  { estado: "COMPLETADO", label: "Completado" },
  { estado: "CANCELADO", label: "Cancelado" },
];

export function EstadoButtons({ id, actual }: { id: string; actual: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPCIONES.filter((o) => o.estado !== actual).map((o) => (
        <form key={o.estado} action={updateEstadoTraslado.bind(null, id, o.estado)}>
          <Button type="submit" size="sm" variant="secondary">Marcar {o.label.toLowerCase()}</Button>
        </form>
      ))}
    </div>
  );
}
