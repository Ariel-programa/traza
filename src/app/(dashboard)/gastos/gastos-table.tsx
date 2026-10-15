"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatDate, formatCurrency, categoriaGastoLabel } from "@/lib/format";
import { deleteGasto } from "./actions";
import type { Gasto, Proveedor, Activo, Vehiculo, Traslado } from "@prisma/client";

type Row = Gasto & { proveedor: Proveedor | null; activo: Activo | null; vehiculo: Vehiculo | null; traslado: Traslado | null };

export function GastosTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    { key: "fecha", header: "Fecha", render: (g) => formatDate(g.fecha), sortValue: (g) => g.fecha.toISOString(), csvValue: (g) => formatDate(g.fecha) },
    { key: "categoria", header: "Categoría", render: (g) => categoriaGastoLabel(g.categoria), csvValue: (g) => categoriaGastoLabel(g.categoria) },
    { key: "relacion", header: "Relacionado a", render: (g) => g.proveedor?.nombre ?? g.activo?.codigo ?? g.vehiculo?.patente ?? g.traslado?.numero ?? "—" },
    { key: "importe", header: "Importe", render: (g) => <span className="font-medium">{formatCurrency(g.importe)}</span>, sortValue: (g) => g.importe, csvValue: (g) => g.importe },
    {
      key: "acciones",
      header: "",
      render: (g) => <DeleteButton action={deleteGasto.bind(null, g.id)} confirmMessage="¿Eliminar este gasto?" />,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(g) => `${categoriaGastoLabel(g.categoria)} ${g.proveedor?.nombre ?? ""} ${g.activo?.codigo ?? ""} ${g.vehiculo?.patente ?? ""}`}
      filters={[
        {
          key: "categoria",
          label: "Categoría",
          options: ["COMBUSTIBLE", "PEAJE", "MANTENIMIENTO", "REPARACION", "ENVIO", "SEGURO", "OTROS"].map((c) => ({ label: categoriaGastoLabel(c), value: c })),
          predicate: (g, v) => g.categoria === v,
        },
      ]}
      exportFilename="gastos-traza"
      emptyTitle="Sin gastos registrados"
      emptyDescription="Registrá el primer gasto de la operación."
    />
  );
}
