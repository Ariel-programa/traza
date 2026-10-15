"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Proveedor, Empresa } from "@prisma/client";

type Row = Proveedor & { empresa: Empresa; _count: { activos: number } };

export function ProveedoresTable({ data, showEmpresa }: { data: Row[]; showEmpresa: boolean }) {
  const columns: Column<Row>[] = [
    { key: "nombre", header: "Nombre", render: (p) => <span className="font-medium">{p.nombre}</span>, sortValue: (p) => p.nombre },
    { key: "servicio", header: "Servicio", render: (p) => p.servicio },
    ...(showEmpresa ? [{ key: "empresa", header: "Empresa", render: (p: Row) => p.empresa.nombre } as Column<Row>] : []),
    { key: "contacto", header: "Contacto", render: (p) => p.contacto ?? "—" },
    { key: "telefono", header: "Teléfono", render: (p) => p.telefono ?? "—" },
    { key: "activos", header: "Activos asignados", render: (p) => p._count.activos },
    { key: "estado", header: "Estado", render: (p) => <StatusBadge estado={p.estado} /> },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(p) => `${p.nombre} ${p.servicio} ${p.contacto ?? ""}`}
      filters={[
        {
          key: "estado",
          label: "Estado",
          options: [{ label: "Activo", value: "ACTIVO" }, { label: "Inactivo", value: "INACTIVO" }],
          predicate: (p, v) => p.estado === v,
        },
      ]}
      rowHref={(p) => `/proveedores/${p.id}`}
      exportFilename="proveedores-traza"
      emptyTitle="Sin proveedores"
      emptyDescription="Agregá tu primer proveedor para asignarlo a activos y mantenimientos."
    />
  );
}
