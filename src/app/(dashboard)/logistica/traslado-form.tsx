"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTraslado, type TrasladoFormState } from "./actions";

type Options = {
  empresas: { id: string; nombre: string }[];
  vehiculos: { id: string; patente: string; marca: string; empresaId: string }[];
  conductores: { id: string; nombre: string; apellido: string; empresaId: string }[];
};

const initialState: TrasladoFormState = {};
const hoy = new Date().toISOString().slice(0, 10);

export function TrasladoForm({
  options,
  fixedEmpresaId,
  vehiculoIdPreseleccionado,
}: {
  options: Options;
  fixedEmpresaId?: string;
  vehiculoIdPreseleccionado?: string;
}) {
  const [state, formAction, pending] = useActionState(createTraslado, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {fixedEmpresaId ? (
        <input type="hidden" name="empresaId" value={fixedEmpresaId} />
      ) : (
        <div>
          <Label htmlFor="empresaId">Empresa</Label>
          <Select id="empresaId" name="empresaId" defaultValue={options.empresas[0]?.id} required>
            {options.empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue="PLANIFICADO">
            <option value="PLANIFICADO">Planificado</option>
            <option value="EN_CURSO">En curso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="origen">Origen</Label>
          <Input id="origen" name="origen" required />
        </div>
        <div>
          <Label htmlFor="destino">Destino</Label>
          <Input id="destino" name="destino" required />
        </div>
        <div>
          <Label htmlFor="vehiculoId">Vehículo</Label>
          <Select id="vehiculoId" name="vehiculoId" defaultValue={vehiculoIdPreseleccionado ?? ""}>
            <option value="">Sin asignar</option>
            {options.vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente} · {v.marca}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="conductorId">Conductor</Label>
          <Select id="conductorId" name="conductorId" defaultValue="">
            <option value="">Sin asignar</option>
            {options.conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" name="cliente" />
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" rows={3} />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Crear traslado"}</Button>
    </form>
  );
}
