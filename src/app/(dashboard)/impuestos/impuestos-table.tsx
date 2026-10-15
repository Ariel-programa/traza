"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency } from "@/lib/format";
import { diasHasta } from "@/lib/vencimientos";
import { deleteImpuesto, marcarImpuestoPagado } from "./actions";
import { Pencil, CheckCircle2 } from "lucide-react";
import type { Impuesto, Vehiculo, Activo } from "@prisma/client";

type Row = Impuesto & { vehiculo: Vehiculo | null; activo: Activo | null };

export function ImpuestosTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    { key: "nombre", header: "Impuesto", render: (i) => <span className="font-medium">{i.nombre}</span>, sortValue: (i) => i.nombre },
    {
      key: "relacion",
      header: "Relacionado a",
      render: (i) => i.vehiculo?.patente ?? i.activo?.codigo ?? "General",
    },
    { key: "importe", header: "Importe", render: (i) => formatCurrency(i.importe), sortValue: (i) => i.importe, csvValue: (i) => i.importe },
    {
      key: "vencimiento",
      header: "Vencimiento",
      render: (i) => formatDate(i.vencimiento),
      sortValue: (i) => i.vencimiento.toISOString(),
      csvValue: (i) => formatDate(i.vencimiento),
    },
    {
      key: "urgencia",
      header: "",
      render: (i) => (i.estado === "PAGADO" ? <StatusBadge estado="PAGADO" /> : <ExpiryBadge dias={diasHasta(i.vencimiento)} />),
    },
    {
      key: "acciones",
      header: "",
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          {i.estado !== "PAGADO" && (
            <form action={marcarImpuestoPagado.bind(null, i.id)}>
              <Button type="submit" size="sm" variant="secondary" title="Marcar como pagado" aria-label={`Marcar ${i.nombre} como pagado`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link href={`/impuestos/${i.id}/editar`} aria-label={`Editar ${i.nombre}`}><Pencil className="h-3.5 w-3.5" /></Link>
          </Button>
          <DeleteButton action={deleteImpuesto.bind(null, i.id)} confirmMessage={`¿Eliminar el impuesto ${i.nombre}?`} label="" />
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(i) => `${i.nombre} ${i.vehiculo?.patente ?? ""} ${i.activo?.codigo ?? ""}`}
      filters={[
        {
          key: "estado",
          label: "Estado",
          options: [
            { label: "Pendiente", value: "PENDIENTE" },
            { label: "Vencido", value: "VENCIDO" },
            { label: "Pagado", value: "PAGADO" },
          ],
          predicate: (i, v) => i.estado === v,
        },
      ]}
      exportFilename="impuestos-traza"
      emptyTitle="Sin impuestos registrados"
      emptyDescription="Registrá el primer impuesto para hacerle seguimiento a su vencimiento."
    />
  );
}
