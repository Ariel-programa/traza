"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createImpuesto, updateImpuesto, type ImpuestoFormState } from "./actions";

type Options = {
  empresas: { id: string; nombre: string }[];
  vehiculos: { id: string; patente: string; marca: string }[];
  activos: { id: string; codigo: string; nombre: string }[];
};

type DefaultValues = {
  nombre?: string;
  vehiculoId?: string;
  activoId?: string;
  importe?: string;
  vencimiento?: string;
  fechaPago?: string;
  comprobanteUrl?: string;
  observaciones?: string;
};

const hoy = new Date().toISOString().slice(0, 10);
const initialState: ImpuestoFormState = {};

export function ImpuestoForm({
  options,
  fixedEmpresaId,
  defaultValues,
  impuestoId,
}: {
  options: Options;
  fixedEmpresaId?: string;
  defaultValues?: DefaultValues;
  impuestoId?: string;
}) {
  const action = impuestoId ? updateImpuesto.bind(null, impuestoId) : createImpuesto;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      {fixedEmpresaId ? (
        <input type="hidden" name="empresaId" value={fixedEmpresaId} />
      ) : (
        <div>
          <Label htmlFor="empresaId">Empresa</Label>
          <Select id="empresaId" name="empresaId" defaultValue={options.empresas[0]?.id} required>
            {options.empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="nombre">Nombre del impuesto</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={defaultValues?.nombre}
          required
          placeholder="Ej: Patente 2026, Ingresos Brutos, Monotributo..."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="importe">Importe</Label>
          <Input id="importe" name="importe" type="number" step="0.01" defaultValue={defaultValues?.importe} required />
        </div>
        <div>
          <Label htmlFor="vencimiento">Vencimiento</Label>
          <Input id="vencimiento" name="vencimiento" type="date" defaultValue={defaultValues?.vencimiento ?? hoy} required />
        </div>
        <div>
          <Label htmlFor="vehiculoId">Vehículo relacionado</Label>
          <Select id="vehiculoId" name="vehiculoId" defaultValue={defaultValues?.vehiculoId ?? ""}>
            <option value="">Sin vehículo (impuesto general)</option>
            {options.vehiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.patente} · {v.marca}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="activoId">Activo relacionado</Label>
          <Select id="activoId" name="activoId" defaultValue={defaultValues?.activoId ?? ""}>
            <option value="">Sin activo</option>
            {options.activos.map((a) => (
              <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fechaPago">Fecha de pago</Label>
          <Input id="fechaPago" name="fechaPago" type="date" defaultValue={defaultValues?.fechaPago} />
          <p className="text-xs text-[var(--text-muted)] mt-1">Dejalo vacío si todavía no se pagó.</p>
        </div>
        <div>
          <Label htmlFor="comprobanteUrl">Comprobante (enlace)</Label>
          <Input id="comprobanteUrl" name="comprobanteUrl" defaultValue={defaultValues?.comprobanteUrl} placeholder="https://..." />
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

      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : impuestoId ? "Guardar cambios" : "Registrar impuesto"}</Button>
    </form>
  );
}
