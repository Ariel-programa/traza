"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateEmpresa, type ConfigFormState } from "./actions";

const initialState: ConfigFormState = {};

export function EmpresaForm({ empresa }: { empresa: { nombre: string; cuit: string | null; email: string | null; telefono: string | null } }) {
  const [state, formAction, pending] = useActionState(updateEmpresa, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="nombre">Nombre de la empresa</Label>
          <Input id="nombre" name="nombre" defaultValue={empresa.nombre} required />
        </div>
        <div>
          <Label htmlFor="cuit">CUIT</Label>
          <Input id="cuit" name="cuit" defaultValue={empresa.cuit ?? ""} />
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={empresa.telefono ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={empresa.email ?? ""} />
        </div>
      </div>
      {state?.error && <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>}
      {state?.success && <p className="text-sm text-[var(--success)] bg-[var(--success-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.success}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Guardar cambios"}</Button>
    </form>
  );
}
