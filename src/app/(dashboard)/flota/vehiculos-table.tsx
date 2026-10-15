"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { formatDate } from "@/lib/format";
import { diasHasta } from "@/lib/vencimientos";
import type { Vehiculo, Empresa } from "@prisma/client";

type Row = Vehiculo & { empresa: Empresa };

export function VehiculosTable({ data, showEmpresa }: { data: Row[]; showEmpresa: boolean }) {
  const columns: Column<Row>[] = [
    { key: "patente", header: "Patente", render: (v) => <span className="font-mono font-medium">{v.patente}</span>, sortValue: (v) => v.patente },
    { key: "vehiculo", header: "Vehículo", render: (v) => `${v.marca} ${v.modelo}${v.anio ? ` (${v.anio})` : ""}`, csvValue: (v) => `${v.marca} ${v.modelo}` },
    { key: "tipo", header: "Tipo", render: (v) => v.tipo, csvValue: (v) => v.tipo },
    ...(showEmpresa ? [{ key: "empresa", header: "Empresa", render: (v: Row) => v.empresa.nombre } as Column<Row>] : []),
    { key: "km", header: "Kilometraje", render: (v) => `${v.kilometraje.toLocaleString("es-AR")} km`, sortValue: (v) => v.kilometraje },
    {
      key: "vtv",
      header: "VTV",
      render: (v) => (v.vtvVencimiento ? <ExpiryBadge dias={diasHasta(v.vtvVencimiento)} /> : "—"),
      sortValue: (v) => v.vtvVencimiento?.toISOString() ?? "",
      csvValue: (v) => formatDate(v.vtvVencimiento),
    },
    {
      key: "seguro",
      header: "Seguro",
      render: (v) => (v.seguroVencimiento ? <ExpiryBadge dias={diasHasta(v.seguroVencimiento)} /> : "—"),
      csvValue: (v) => formatDate(v.seguroVencimiento),
    },
    { key: "estado", header: "Estado", render: (v) => <StatusBadge estado={v.estado} />, csvValue: (v) => v.estado },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(v) => `${v.patente} ${v.marca} ${v.modelo}`}
      filters={[
        {
          key: "estado",
          label: "Estado",
          options: [
            { label: "Disponible", value: "DISPONIBLE" },
            { label: "En viaje", value: "EN_VIAJE" },
            { label: "En mantenimiento", value: "EN_MANTENIMIENTO" },
            { label: "Fuera de servicio", value: "FUERA_DE_SERVICIO" },
          ],
          predicate: (v, val) => v.estado === val,
        },
      ]}
      rowHref={(v) => `/flota/${v.id}`}
      exportFilename="flota-traza"
      emptyTitle="Sin vehículos"
      emptyDescription="Agregá el primer vehículo de la flota."
    />
  );
}
