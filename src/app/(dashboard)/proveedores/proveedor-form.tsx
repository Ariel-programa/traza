"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ProveedorFormState } from "./actions";

type DefaultValues = {
  nombre?: string; cuit?: string; contacto?: string; telefono?: string; email?: string;
  servicio?: string; estado?: string; observaciones?: string; empresaId?: string;
};

const initialState: ProveedorFormState = {};

export function ProveedorForm({
  action,
  empresas,
  fixedEmpresaId,
  defaultValues,
  submitLabel,
}: {
  action: (state: ProveedorFormState, formData: FormData) => Promise<ProveedorFormState>;
  empresas: { id: string; nombre: string }[];
  fixedEmpresaId?: string;
  defaultValues?: DefaultValues;
  submitLabel: string;
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
          <Label htmlFor="nombre">Nombre / Razón social</Label>
          <Input id="nombre" name="nombre" defaultValue={defaultValues?.nombre} required />
        </div>
        <div>
          <Label htmlFor="cuit">CUIT</Label>
          <Input id="cuit" name="cuit" defaultValue={defaultValues?.cuit} />
        </div>
        <div>
          <Label htmlFor="servicio">Servicio que ofrece</Label>
          <Input id="servicio" name="servicio" defaultValue={defaultValues?.servicio} placeholder="Ej: Matafuegos, Transporte..." required />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select id="estado" name="estado" defaultValue={defaultValues?.estado ?? "ACTIVO"}>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="contacto">Persona de contacto</Label>
          <Input id="contacto" name="contacto" defaultValue={defaultValues?.contacto} />
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={defaultValues?.telefono} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" rows={3} defaultValue={defaultValues?.observaciones} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : submitLabel}</Button>
    </form>
  );
}
