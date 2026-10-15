"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatDate, formatCurrency } from "@/lib/format";
import { deleteCombustibleCarga } from "./actions";
import { TicketPreview } from "./ticket-preview";
import type { CombustibleCarga, Vehiculo, Conductor } from "@prisma/client";

type Row = CombustibleCarga & { vehiculo: Vehiculo; conductor: Conductor | null };

export function CombustibleTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    { key: "fecha", header: "Fecha", render: (c) => formatDate(c.fecha), sortValue: (c) => c.fecha.toISOString() },
    { key: "vehiculo", header: "Vehículo", render: (c) => `${c.vehiculo.patente} · ${c.vehiculo.marca}` },
    { key: "conductor", header: "Conductor", render: (c) => c.conductor ? `${c.conductor.nombre} ${c.conductor.apellido}` : "—" },
    { key: "estacion", header: "Estación", render: (c) => c.estacion ?? "—" },
    { key: "litros", header: "Litros", render: (c) => c.litros.toFixed(1), sortValue: (c) => c.litros },
    { key: "precio", header: "Precio/L", render: (c) => formatCurrency(c.precioLitro) },
    { key: "importe", header: "Importe", render: (c) => <span className="font-medium">{formatCurrency(c.importe)}</span>, sortValue: (c) => c.importe },
    { key: "ticket", header: "Ticket", render: (c) => <TicketPreview fotoTicket={c.fotoTicket} /> },
    {
      key: "acciones",
      header: "",
      render: (c) => <DeleteButton action={deleteCombustibleCarga.bind(null, c.id)} confirmMessage="¿Eliminar esta carga de combustible?" />,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(c) => `${c.vehiculo.patente} ${c.estacion ?? ""}`}
      exportFilename="combustible-traza"
      emptyTitle="Sin cargas registradas"
      emptyDescription="Registrá la primera carga de combustible de la flota."
    />
  );
}
