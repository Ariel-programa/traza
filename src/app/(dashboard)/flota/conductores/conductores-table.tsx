"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpiryBadge } from "@/components/ui/expiry-badge";
import { diasHasta } from "@/lib/vencimientos";
import type { Conductor, Empresa } from "@prisma/client";

type Row = Conductor & { empresa: Empresa };

export function ConductoresTable({ data, showEmpresa }: { data: Row[]; showEmpresa: boolean }) {
  const columns: Column<Row>[] = [
    { key: "nombre", header: "Nombre", render: (c) => <span className="font-medium">{c.nombre} {c.apellido}</span>, sortValue: (c) => c.apellido },
    { key: "documento", header: "Documento", render: (c) => c.documento ?? "—" },
    { key: "licencia", header: "Licencia", render: (c) => c.licencia ?? "—" },
    {
      key: "vencimiento",
      header: "Vence licencia",
      render: (c) => (c.licenciaVencimiento ? <ExpiryBadge dias={diasHasta(c.licenciaVencimiento)} /> : "—"),
      sortValue: (c) => c.licenciaVencimiento?.toISOString() ?? "",
    },
    { key: "telefono", header: "Teléfono", render: (c) => c.telefono ?? "—" },
    ...(showEmpresa ? [{ key: "empresa", header: "Empresa", render: (c: Row) => c.empresa.nombre } as Column<Row>] : []),
    { key: "estado", header: "Estado", render: (c) => <StatusBadge estado={c.estado} /> },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(c) => `${c.nombre} ${c.apellido} ${c.documento ?? ""}`}
      rowHref={(c) => `/flota/conductores/${c.id}`}
      emptyTitle="Sin conductores"
      emptyDescription="Agregá el primer conductor de la flota."
    />
  );
}
