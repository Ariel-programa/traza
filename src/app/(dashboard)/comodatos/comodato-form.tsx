"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createComodato, type ComodatoFormState } from "./actions";

const initialState: ComodatoFormState = {};

export function ComodatoForm({ activos }: { activos: { id: string; codigo: string; nombre: string }[] }) {
  const [state, formAction, pending] = useActionState(createComodato, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div>
        <Label htmlFor="activoId">Activo</Label>
        <Select id="activoId" name="activoId" required>
          <option value="">Seleccioná un activo</option>
          {activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
        </Select>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="propietario">Propietario</Label>
          <Input id="propietario" name="propietario" required placeholder="Ej: Extintores Cuyo S.R.L." />
        </div>
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" name="cliente" required placeholder="Ej: Bodega San Rafael S.A." />
        </div>
        <div>
          <Label htmlFor="fechaInicio">Fecha de inicio</Label>
          <Input id="fechaInicio" name="fechaInicio" type="date" required />
        </div>
        <div>
          <Label htmlFor="fechaFinal">Fecha de finalización</Label>
          <Input id="fechaFinal" name="fechaFinal" type="date" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ubicacion">Ubicación del activo</Label>
          <Input id="ubicacion" name="ubicacion" />
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" rows={3} />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Registrar comodato"}</Button>
    </form>
  );
}
