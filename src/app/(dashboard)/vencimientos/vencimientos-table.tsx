"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { formatDate, formatCurrency } from "@/lib/format";
import { CATEGORIA_LABEL, type ItemVencimiento } from "@/lib/vencimientos-center";

export function VencimientosTable({ data }: { data: ItemVencimiento[] }) {
  const columns: Column<ItemVencimiento>[] = [
    {
      key: "categoria",
      header: "Categoría",
      render: (i) => <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{i.categoriaLabel}</span>,
    },
    {
      key: "titulo",
      header: "Elemento",
      render: (i) => (
        <Link href={i.href} className="font-medium hover:text-[var(--brand)]">{i.titulo}</Link>
      ),
      sortValue: (i) => i.titulo,
    },
    { key: "detalle", header: "Detalle", render: (i) => i.detalle },
    {
      key: "monto",
      header: "Importe",
      render: (i) => (i.monto !== undefined ? formatCurrency(i.monto) : "—"),
      sortValue: (i) => i.monto ?? -1,
      csvValue: (i) => i.monto ?? "",
    },
    {
      key: "fecha",
      header: "Vencimiento",
      render: (i) => formatDate(i.fecha),
      sortValue: (i) => i.fecha.toISOString(),
      csvValue: (i) => formatDate(i.fecha),
    },
    {
      key: "urgencia",
      header: "Urgencia",
      render: (i) => <ExpiryBadge dias={i.dias} />,
      sortValue: (i) => i.dias ?? 999999,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(i) => `${i.titulo} ${i.detalle} ${i.categoriaLabel}`}
      filters={[
        {
          key: "categoria",
          label: "Categoría",
          options: Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({ label, value })),
          predicate: (i, v) => i.categoria === v,
        },
      ]}
      exportFilename="vencimientos-traza"
      emptyTitle="Sin vencimientos en este rango"
      emptyDescription="No hay nada que requiera atención en el período seleccionado."
    />
  );
}
