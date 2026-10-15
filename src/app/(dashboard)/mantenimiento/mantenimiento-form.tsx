"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { tipoMantenimientoLabel } from "@/lib/format";
import { createMantenimiento, type MantenimientoFormState } from "./actions";

type Options = {
  activos: { id: string; codigo: string; nombre: string }[];
  proveedores: { id: string; nombre: string }[];
  tecnicos: { id: string; nombre: string; apellido: string }[];
};

const TIPOS = ["INSPECCION", "MANTENIMIENTO", "REPARACION", "RECARGA", "CALIBRACION", "INSTALACION", "RETIRO", "OTRO"];
const initialState: MantenimientoFormState = {};
const hoy = new Date().toISOString().slice(0, 10);

export function MantenimientoForm({ options, activoIdPreseleccionado }: { options: Options; activoIdPreseleccionado?: string }) {
  const [state, formAction, pending] = useActionState(createMantenimiento, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div>
        <Label htmlFor="activoId">Activo</Label>
        <Select id="activoId" name="activoId" defaultValue={activoIdPreseleccionado} required>
          <option value="">Seleccioná un activo</option>
          {options.activos.map((a) => (
            <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>
          ))}
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo de intervención</Label>
          <Select id="tipo" name="tipo" defaultValue="MANTENIMIENTO" required>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{tipoMantenimientoLabel(t)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="proveedorId">Proveedor</Label>
          <Select id="proveedorId" name="proveedorId" defaultValue="">
            <option value="">Sin proveedor</option>
            {options.proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tecnicoId">Técnico</Label>
          <Select id="tecnicoId" name="tecnicoId" defaultValue="">
            <option value="">Sin técnico asignado</option>
            {options.tecnicos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre} {t.apellido}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="resultado">Resultado</Label>
          <Input id="resultado" name="resultado" placeholder="Ej: Aprobado" />
        </div>
        <div>
          <Label htmlFor="proximaFecha">Próxima fecha (actualiza el vencimiento)</Label>
          <Input id="proximaFecha" name="proximaFecha" type="date" />
        </div>
      </div>

      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" rows={3} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Registrar mantenimiento"}</Button>
    </form>
  );
}
