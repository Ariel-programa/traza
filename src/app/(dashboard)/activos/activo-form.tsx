"use client";

import { useActionState, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { tipoActivoLabel } from "@/lib/format";
import type { ActivoFormState } from "./actions";

type Options = {
  empresas: { id: string; nombre: string }[];
  ubicaciones: { id: string; nombre: string; empresaId: string }[];
  proveedores: { id: string; nombre: string; empresaId: string }[];
};

type DefaultValues = {
  tipo?: string;
  nombre?: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  empresaId?: string;
  ubicacionId?: string;
  proveedorId?: string;
  modalidad?: string;
  fechaAdquisicion?: string;
  ultimaInspeccion?: string;
  proximoVencimiento?: string;
  observaciones?: string;
  tipoMatafuego?: string;
  capacidadKg?: string;
  subtipoMedico?: string;
  responsableMedico?: string;
};

const TIPOS = [
  "MATAFUEGO", "EQUIPO_MEDICO", "EQUIPO_INFORMATICO", "HERRAMIENTA", "MAQUINARIA",
  "ALARMA", "EQUIPO_CONTRA_INCENDIO", "EQUIPO_ELECTRICO", "OTRO",
];

const initialState: ActivoFormState = {};

export function ActivoForm({
  action,
  options,
  defaultValues,
  submitLabel,
  fixedEmpresaId,
}: {
  action: (state: ActivoFormState, formData: FormData) => Promise<ActivoFormState>;
  options: Options;
  defaultValues?: DefaultValues;
  submitLabel: string;
  fixedEmpresaId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tipo, setTipo] = useState(defaultValues?.tipo ?? "MATAFUEGO");
  const [empresaId, setEmpresaId] = useState(defaultValues?.empresaId ?? fixedEmpresaId ?? options.empresas[0]?.id ?? "");

  const ubicacionesFiltradas = options.ubicaciones.filter((u) => u.empresaId === empresaId);
  const proveedoresFiltrados = options.proveedores.filter((p) => p.empresaId === empresaId);

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de activo</Label>
          <Select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{tipoActivoLabel(t)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={defaultValues?.nombre} required placeholder="Ej: Matafuego ABC 5kg" />
        </div>
        <div>
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" name="marca" defaultValue={defaultValues?.marca} />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" name="modelo" defaultValue={defaultValues?.modelo} />
        </div>
        <div>
          <Label htmlFor="numeroSerie">Número de serie</Label>
          <Input id="numeroSerie" name="numeroSerie" defaultValue={defaultValues?.numeroSerie} />
        </div>
        <div>
          <Label htmlFor="modalidad">Modalidad</Label>
          <Select id="modalidad" name="modalidad" defaultValue={defaultValues?.modalidad ?? "PROPIO"}>
            <option value="PROPIO">Propio</option>
            <option value="COMODATO">Comodato</option>
          </Select>
        </div>
      </div>

      {tipo === "MATAFUEGO" && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Datos específicos de matafuego
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoMatafuego">Tipo de matafuego</Label>
              <Select id="tipoMatafuego" name="tipoMatafuego" defaultValue={defaultValues?.tipoMatafuego ?? "ABC"}>
                <option value="ABC">ABC</option>
                <option value="BC">BC</option>
                <option value="CO2">CO2</option>
                <option value="AGUA">Agua</option>
                <option value="ESPUMA">Espuma</option>
                <option value="OTRO">Otro</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="capacidadKg">Capacidad (kg)</Label>
              <Input id="capacidadKg" name="capacidadKg" type="number" step="0.5" defaultValue={defaultValues?.capacidadKg} />
            </div>
          </div>
        </div>
      )}

      {tipo === "EQUIPO_MEDICO" && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-3">
            Datos específicos de equipo médico
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtipoMedico">Subtipo</Label>
              <Input id="subtipoMedico" name="subtipoMedico" defaultValue={defaultValues?.subtipoMedico} placeholder="Ej: Desfibrilador" />
            </div>
            <div>
              <Label htmlFor="responsableMedico">Responsable</Label>
              <Input id="responsableMedico" name="responsableMedico" defaultValue={defaultValues?.responsableMedico} />
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="empresaId">Empresa</Label>
          {fixedEmpresaId ? (
            <>
              <Input disabled value={options.empresas.find((e) => e.id === fixedEmpresaId)?.nombre ?? ""} />
              <input type="hidden" name="empresaId" value={fixedEmpresaId} />
            </>
          ) : (
            <Select
              id="empresaId"
              name="empresaId"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              required
            >
              {options.empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="ubicacionId">Ubicación</Label>
          <Select id="ubicacionId" name="ubicacionId" defaultValue={defaultValues?.ubicacionId ?? ""}>
            <option value="">Sin ubicación</option>
            {ubicacionesFiltradas.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="proveedorId">Proveedor</Label>
          <Select id="proveedorId" name="proveedorId" defaultValue={defaultValues?.proveedorId ?? ""}>
            <option value="">Sin proveedor</option>
            {proveedoresFiltrados.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="fechaAdquisicion">Fecha de adquisición</Label>
          <Input id="fechaAdquisicion" name="fechaAdquisicion" type="date" defaultValue={defaultValues?.fechaAdquisicion} />
        </div>
        <div>
          <Label htmlFor="ultimaInspeccion">Última inspección</Label>
          <Input id="ultimaInspeccion" name="ultimaInspeccion" type="date" defaultValue={defaultValues?.ultimaInspeccion} />
        </div>
        <div>
          <Label htmlFor="proximoVencimiento">{tipo === "EQUIPO_MEDICO" ? "Próxima calibración" : "Próximo vencimiento"}</Label>
          <Input id="proximoVencimiento" name="proximoVencimiento" type="date" defaultValue={defaultValues?.proximoVencimiento} />
        </div>
      </div>

      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" defaultValue={defaultValues?.observaciones} rows={3} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Guardando..." : submitLabel}</Button>
      </div>
    </form>
  );
}
