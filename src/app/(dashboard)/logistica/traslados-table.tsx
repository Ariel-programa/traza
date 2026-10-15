"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { Traslado, Vehiculo, Conductor } from "@prisma/client";

type Row = Traslado & { vehiculo: Vehiculo | null; conductor: Conductor | null };

export function TrasladosTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    { key: "numero", header: "N°", render: (t) => <Link href={`/logistica/${t.id}`} className="font-mono text-xs font-medium hover:text-[var(--brand)]">{t.numero}</Link>, sortValue: (t) => t.numero },
    { key: "fecha", header: "Fecha", render: (t) => formatDate(t.fecha), sortValue: (t) => t.fecha.toISOString() },
    { key: "ruta", header: "Ruta", render: (t) => `${t.origen} → ${t.destino}` },
    { key: "vehiculo", header: "Vehículo", render: (t) => t.vehiculo?.patente ?? "—" },
    { key: "conductor", header: "Conductor", render: (t) => t.conductor ? `${t.conductor.nombre} ${t.conductor.apellido}` : "—" },
    { key: "cliente", header: "Cliente", render: (t) => t.cliente ?? "—" },
    { key: "estado", header: "Estado", render: (t) => <StatusBadge estado={t.estado} /> },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(t) => `${t.numero} ${t.origen} ${t.destino} ${t.cliente ?? ""}`}
      filters={[
        {
          key: "estado",
          label: "Estado",
          options: [
            { label: "Planificado", value: "PLANIFICADO" },
            { label: "En curso", value: "EN_CURSO" },
            { label: "Completado", value: "COMPLETADO" },
            { label: "Cancelado", value: "CANCELADO" },
          ],
          predicate: (t, v) => t.estado === v,
        },
      ]}
      rowHref={(t) => `/logistica/${t.id}`}
      exportFilename="traslados-traza"
      emptyTitle="Sin traslados"
      emptyDescription="Planificá el primer traslado de mercadería o pasajeros."
    />
  );
}
