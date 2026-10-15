"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TicketScanner } from "./ticket-scanner";
import { takePendingTicketScan } from "@/lib/scan-ticket-combustible";
import { createCombustibleCarga, type CombustibleFormState } from "./actions";

type Options = {
  vehiculos: { id: string; patente: string; marca: string }[];
  conductores: { id: string; nombre: string; apellido: string }[];
};

const initialState: CombustibleFormState = {};
const hoy = new Date().toISOString().slice(0, 10);

export function CombustibleForm({ options, vehiculoIdPreseleccionado }: { options: Options; vehiculoIdPreseleccionado?: string }) {
  const [state, formAction, pending] = useActionState(createCombustibleCarga, initialState);
  const [fotoTicket, setFotoTicket] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const fechaRef = useRef<HTMLInputElement>(null);
  const estacionRef = useRef<HTMLInputElement>(null);
  const litrosRef = useRef<HTMLInputElement>(null);
  const precioLitroRef = useRef<HTMLInputElement>(null);

  function applyScan(result: { fecha?: string; estacion?: string; litros?: number; precioLitro?: number }, dataUrl: string) {
    setFotoTicket(dataUrl);
    if (result.fecha && fechaRef.current) fechaRef.current.value = result.fecha;
    if (result.estacion && estacionRef.current) estacionRef.current.value = result.estacion;
    if (result.litros != null && litrosRef.current) litrosRef.current.value = String(result.litros);
    if (result.precioLitro != null && precioLitroRef.current) precioLitroRef.current.value = String(result.precioLitro);
  }

  // Si venimos del botón de cámara rápida en la lista (quick-scan-button.tsx),
  // el escaneo ya se hizo antes de llegar acá y viaja por sessionStorage (no
  // por props ni URL, ver scan-ticket-combustible.ts) -- sincronizamos ese
  // valor externo una sola vez al montar. No hay forma de derivarlo durante
  // el render sin arriesgar un mismatch de hidratación en una carga directa.
  useEffect(() => {
    const pending = takePendingTicketScan();
    if (pending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync desde sessionStorage (fuente externa), no estado derivable en el render
      applyScan(pending.parsed, pending.fotoDataUrl);
      setPendingPhoto(pending.fotoDataUrl);
    }
  }, []);

  return (
    <form action={formAction} className="space-y-5 max-w-2xl">
      <input type="hidden" name="fotoTicket" value={fotoTicket ?? ""} />
      <TicketScanner initialPhoto={pendingPhoto} initialScanned={!!pendingPhoto} onScanned={applyScan} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehiculoId">Vehículo</Label>
          <Select id="vehiculoId" name="vehiculoId" defaultValue={vehiculoIdPreseleccionado ?? ""} required>
            <option value="">Seleccioná un vehículo</option>
            {options.vehiculos.map((v) => <option key={v.id} value={v.id}>{v.patente} · {v.marca}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="conductorId">Conductor</Label>
          <Select id="conductorId" name="conductorId" defaultValue="">
            <option value="">Sin asignar</option>
            {options.conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input ref={fechaRef} id="fecha" name="fecha" type="date" defaultValue={hoy} required />
        </div>
        <div>
          <Label htmlFor="estacion">Estación de servicio</Label>
          <Input ref={estacionRef} id="estacion" name="estacion" />
        </div>
        <div>
          <Label htmlFor="litros">Litros</Label>
          <Input ref={litrosRef} id="litros" name="litros" type="number" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="precioLitro">Precio por litro</Label>
          <Input ref={precioLitroRef} id="precioLitro" name="precioLitro" type="number" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="kilometraje">Kilometraje actual</Label>
          <Input id="kilometraje" name="kilometraje" type="number" />
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-[var(--danger)] bg-[var(--danger-soft)] rounded-[var(--radius-sm)] px-3 py-2">{state.error}</p>
      )}
      <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Registrar carga"}</Button>
    </form>
  );
}
