"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ConductorFormState } from "../actions";

type DefaultValues = {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  licencia?: string;
  licenciaVencimiento?: string;
  estado?: string;
  empresaId?: string;
};

const initialState: ConductorFormState = {};

export function ConductorForm({
  action,
  empresas,
  fixedEmpresaId,
  defaultValues,
  submitLabel = "Crear conductor",
}: {
  action: (state: ConductorFormState, formData: FormData) => Promise<ConductorFormState>;
  empresas: { id: string; nombre: string }[];
  fixedEmpresaId?: string;
  defaultValues?: DefaultValues;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {fixedEmpresaId ? (
        <input type="hidden" name="empresaId" value={fixedEmpresaId} />
      ) : (
        <div>
          <Label htmlFor="empresaId">Empresa</Label>
          <Select id="empresaId" name="empresaId" defaultValue={defaultValues?.empresaId ?? empresas[0]?.id} required>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={defaultValues?.nombre} required />
        </div>
        <div>
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" name="apellido" defaultValue={defaultValues?.apellido} required />
        </div>
        <div>
          <Label htmlFor="documento">Documento</Label>
          <Input id="documento" name="documento" defaultValue={defaultValues?.documento} />
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={defaultValues?.telefono} />
        </div>
        <div>
          <Label htmlFor="licencia">Licencia de conducir</Label>
          <Input id="licencia" name="licencia" defaultValue={defaultValues?.licencia} />
        </div>
        <div>
          <Label htmlFor="licenciaVencimiento">Vencimiento de licencia</Label>
          <Input id="licenciaVencimiento" name="licenciaVencimiento" type="date" defaultValue={defaultValues?.licenciaVencimiento} />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue={defaultValues?.estado ?? "ACTIVO"}>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </Select>
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : submitLabel}</Button>
    </form>
  );
}
