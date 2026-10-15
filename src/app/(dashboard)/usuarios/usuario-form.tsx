"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createUsuario, type UsuarioFormState } from "./actions";

const initialState: UsuarioFormState = {};

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador", EMPRESA: "Empresa", PROVEEDOR: "Proveedor", TECNICO: "Técnico", CONDUCTOR: "Conductor",
};

export function UsuarioForm({ empresas, isAdmin }: { empresas: { id: string; nombre: string }[]; isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(createUsuario, initialState);
  const roles = isAdmin ? ["ADMIN", "EMPRESA", "PROVEEDOR", "TECNICO", "CONDUCTOR"] : ["EMPRESA", "PROVEEDOR", "TECNICO", "CONDUCTOR"];

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {isAdmin && (
        <div>
          <Label htmlFor="empresaId">Empresa</Label>
          <Select id="empresaId" name="empresaId" defaultValue="">
            <option value="">Sin empresa (uso interno de TRAZA)</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" required />
        </div>
        <div>
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" name="apellido" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" required minLength={6} />
        </div>
        <div>
          <Label htmlFor="rol">Rol</Label>
          <Select id="rol" name="rol" defaultValue="EMPRESA">
            {roles.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </Select>
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Creando..." : "Crear usuario"}</Button>
    </form>
  );
}
