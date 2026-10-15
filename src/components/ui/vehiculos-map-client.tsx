"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { fixLeafletIcons } from "./leaflet-icon-fix";
import { formatRelativo } from "@/lib/format";

export type VehiculoMarker = {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  estado: string;
  lat: number;
  lng: number;
  actualizada: string; // ISO -- ver vehiculos-map.tsx, se serializa antes de cruzar a cliente
};

const ESTADO_COLOR: Record<string, string> = {
  DISPONIBLE: "#16a34a",
  EN_VIAJE: "#2563eb",
  EN_MANTENIMIENTO: "#d97706",
  INACTIVO: "#64748b",
};

export function VehiculosMapClient({ vehiculos, height = 320 }: { vehiculos: VehiculoMarker[]; height?: number }) {
  React.useEffect(() => {
    fixLeafletIcons();
  }, []);

  if (vehiculos.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]"
      >
        Sin ubicaciones cargadas todavía.
      </div>
    );
  }

  const center: [number, number] =
    vehiculos.length === 1
      ? [vehiculos[0].lat, vehiculos[0].lng]
      : [
          vehiculos.reduce((s, v) => s + v.lat, 0) / vehiculos.length,
          vehiculos.reduce((s, v) => s + v.lng, 0) / vehiculos.length,
        ];

  return (
    <div style={{ height }} className="overflow-hidden rounded-[var(--radius-md)]">
      <MapContainer center={center} zoom={vehiculos.length === 1 ? 14 : 6} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehiculos.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{v.patente}</p>
                <p>{v.marca} {v.modelo}</p>
                <p style={{ color: ESTADO_COLOR[v.estado] ?? "#64748b" }}>{v.estado.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500 mt-1">Actualizado {formatRelativo(v.actualizada)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
