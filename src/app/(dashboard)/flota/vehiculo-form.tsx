"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { VehiculoFormState } from "./actions";

type DefaultValues = {
  patente?: string; marca?: string; modelo?: string; anio?: string; tipo?: string;
  kilometraje?: string; estado?: string; serviceProximo?: string; vtvVencimiento?: string;
  seguroVencimiento?: string; empresaId?: string;
};

const initialState: VehiculoFormState = {};

export function VehiculoForm({
  action, empresas, fixedEmpresaId, defaultValues, submitLabel, isEdit,
}: {
  action: (state: VehiculoFormState, formData: FormData) => Promise<VehiculoFormState>;
  empresas: { id: string; nombre: string }[];
  fixedEmpresaId?: string;
  defaultValues?: DefaultValues;
  submitLabel: string;
  isEdit?: boolean;
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
          <Label htmlFor="patente">Patente</Label>
          <Input id="patente" name="patente" defaultValue={defaultValues?.patente} required disabled={isEdit} className={isEdit ? "opacity-60" : ""} />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Input id="tipo" name="tipo" defaultValue={defaultValues?.tipo} placeholder="Camioneta, furgón..." required />
        </div>
        <div>
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" name="marca" defaultValue={defaultValues?.marca} required />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" name="modelo" defaultValue={defaultValues?.modelo} required />
        </div>
        <div>
          <Label htmlFor="anio">Año</Label>
          <Input id="anio" name="anio" type="number" defaultValue={defaultValues?.anio} />
        </div>
        <div>
          <Label htmlFor="kilometraje">Kilometraje</Label>
          <Input id="kilometraje" name="kilometraje" type="number" defaultValue={defaultValues?.kilometraje} />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue={defaultValues?.estado ?? "DISPONIBLE"}>
            <option value="DISPONIBLE">Disponible</option>
            <option value="EN_VIAJE">En viaje</option>
            <option value="EN_MANTENIMIENTO">En mantenimiento</option>
            <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="serviceProximo">Próximo service</Label>
          <Input id="serviceProximo" name="serviceProximo" type="date" defaultValue={defaultValues?.serviceProximo} />
        </div>
        <div>
          <Label htmlFor="vtvVencimiento">Vencimiento VTV</Label>
          <Input id="vtvVencimiento" name="vtvVencimiento" type="date" defaultValue={defaultValues?.vtvVencimiento} />
        </div>
        <div>
          <Label htmlFor="seguroVencimiento">Vencimiento seguro</Label>
          <Input id="seguroVencimiento" name="seguroVencimiento" type="date" defaultValue={defaultValues?.seguroVencimiento} />
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : submitLabel}</Button>
    </form>
  );
}
