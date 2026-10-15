"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { categoriaGastoLabel } from "@/lib/format";
import { createGasto, type GastoFormState } from "./actions";

type Options = {
  empresas: { id: string; nombre: string }[];
  proveedores: { id: string; nombre: string }[];
  activos: { id: string; codigo: string; nombre: string }[];
  vehiculos: { id: string; patente: string; marca: string }[];
  traslados: { id: string; numero: string }[];
};

const initialState: GastoFormState = {};
const hoy = new Date().toISOString().slice(0, 10);
const CATEGORIAS = ["COMBUSTIBLE", "PEAJE", "MANTENIMIENTO", "REPARACION", "ENVIO", "SEGURO", "OTROS"];

export function GastoForm({
  options,
  fixedEmpresaId,
  trasladoIdPreseleccionado,
  vehiculoIdPreseleccionado,
}: {
  options: Options;
  fixedEmpresaId?: string;
  trasladoIdPreseleccionado?: string;
  vehiculoIdPreseleccionado?: string;
}) {
  const [state, formAction, pending] = useActionState(createGasto, initialState);

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
          <Label htmlFor="categoria">Categoría</Label>
          <Select id="categoria" name="categoria" defaultValue="OTROS">
            {CATEGORIAS.map((c) => <option key={c} value={c}>{categoriaGastoLabel(c)}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="importe">Importe</Label>
          <Input id="importe" name="importe" type="number" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="proveedorId">Proveedor</Label>
          <Select id="proveedorId" name="proveedorId" defaultValue="">
            <option value="">Sin proveedor</option>
            {options.proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="activoId">Activo relacionado</Label>
          <Select id="activoId" name="activoId" defaultValue="">
            <option value="">Sin activo</option>
            {options.activos.map((a) => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="vehiculoId">Vehículo relacionado</Label>
          <Select id="vehiculoId" name="vehiculoId" defaultValue={vehiculoIdPreseleccionado ?? ""}>
            <option value="">Sin vehículo</option>
            {options.vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente} · {v.marca}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="trasladoId">Traslado relacionado</Label>
          <Select id="trasladoId" name="trasladoId" defaultValue={trasladoIdPreseleccionado ?? ""}>
            <option value="">Sin traslado</option>
            {options.traslados.map((t) => <option key={t.id} value={t.id}>{t.numero}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="comprobanteUrl">Comprobante (enlace)</Label>
          <Input id="comprobanteUrl" name="comprobanteUrl" placeholder="https://..." />
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea id="observaciones" name="observaciones" rows={3} />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Registrar gasto"}</Button>
    </form>
  );
}
