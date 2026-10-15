"use client";

import { useActionState, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createDocumento, updateDocumento, type DocumentoFormState } from "./actions";

type Options = {
  activos: { id: string; codigo: string; nombre: string }[];
  vehiculos: { id: string; patente: string; marca: string }[];
  conductores: { id: string; nombre: string; apellido: string }[];
  proveedores: { id: string; nombre: string }[];
  empresas: { id: string; nombre: string }[];
};

type DefaultValues = {
  tipo?: string;
  numero?: string;
  fechaEmision?: string;
  vencimiento?: string;
  archivoUrl?: string;
};

const initialState: DocumentoFormState = {};
const TIPOS_SUGERIDOS = ["Seguro", "VTV", "Certificado de habilitación", "Licencia", "Garantía", "Constancia AFIP", "Otro"];

export function DocumentoForm({
  options,
  preseleccion,
  documentoId,
  defaultValues,
}: {
  options: Options;
  preseleccion?: { entidadTipo?: string; entidadId?: string };
  documentoId?: string;
  defaultValues?: DefaultValues;
}) {
  const action = documentoId ? updateDocumento.bind(null, documentoId) : createDocumento;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [entidadTipo, setEntidadTipo] = useState(preseleccion?.entidadTipo ?? "ACTIVO");

  const listaActual = {
    ACTIVO: options.activos.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.nombre}` })),
    VEHICULO: options.vehiculos.map((v) => ({ value: v.id, label: `${v.patente} · ${v.marca}` })),
    CONDUCTOR: options.conductores.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` })),
    PROVEEDOR: options.proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    EMPRESA: options.empresas.map((e) => ({ value: e.id, label: e.nombre })),
  }[entidadTipo as "ACTIVO" | "VEHICULO" | "CONDUCTOR" | "PROVEEDOR" | "EMPRESA"];

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entidadTipo">Aplica a</Label>
          <Select id="entidadTipo" name="entidadTipo" value={entidadTipo} onChange={(e) => setEntidadTipo(e.target.value)}>
            <option value="ACTIVO">Activo</option>
            <option value="VEHICULO">Vehículo</option>
            <option value="CONDUCTOR">Conductor</option>
            <option value="PROVEEDOR">Proveedor</option>
            <option value="EMPRESA">Empresa</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="entidadId">Seleccionar</Label>
          <Select id="entidadId" name="entidadId" defaultValue={preseleccion?.entidadId} required>
            <option value="">Seleccioná una opción</option>
            {listaActual.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="tipo">Tipo de documento</Label>
          <Input id="tipo" name="tipo" list="tipos-documento" placeholder="Ej: Seguro" defaultValue={defaultValues?.tipo} required />
          <datalist id="tipos-documento">
            {TIPOS_SUGERIDOS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <div>
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" name="numero" defaultValue={defaultValues?.numero} />
        </div>
        <div>
          <Label htmlFor="fechaEmision">Fecha de emisión</Label>
          <Input id="fechaEmision" name="fechaEmision" type="date" defaultValue={defaultValues?.fechaEmision} />
        </div>
        <div>
          <Label htmlFor="vencimiento">Vencimiento</Label>
          <Input id="vencimiento" name="vencimiento" type="date" defaultValue={defaultValues?.vencimiento} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="archivoUrl">Enlace al archivo (opcional)</Label>
          <Input id="archivoUrl" name="archivoUrl" defaultValue={defaultValues?.archivoUrl} placeholder="https://..." />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : documentoId ? "Guardar cambios" : "Guardar documento"}</Button>
    </form>
  );
}
