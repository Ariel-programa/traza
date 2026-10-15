"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehiculoMarker } from "./vehiculos-map-client";

export type { VehiculoMarker };

// Leaflet toca `window`/`document` al importarse -- tiene que cargarse solo
// en el cliente. El `ssr: false` de next/dynamic únicamente se permite desde
// un Client Component, por eso este wrapper existe separado del real.
const VehiculosMapClient = dynamic(() => import("./vehiculos-map-client").then((m) => m.VehiculosMapClient), {
  ssr: false,
  loading: () => <Skeleton className="h-80 rounded-[var(--radius-md)]" />,
});

export function VehiculosMap(props: { vehiculos: VehiculoMarker[]; height?: number }) {
  return <VehiculosMapClient {...props} />;
}
