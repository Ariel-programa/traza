"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatDate } from "@/lib/format";
import { deleteComodato } from "./actions";
import type { Comodato, Activo } from "@prisma/client";

type Row = Comodato & { activo: Activo };

export function ComodatosTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    {
      key: "activo",
      header: "Activo",
      render: (c) => <Link href={`/activos/${c.activoId}`} className="font-medium hover:text-[var(--brand)]">{c.activo.codigo} · {c.activo.nombre}</Link>,
      sortValue: (c) => c.activo.codigo,
    },
    { key: "propietario", header: "Propietario", render: (c) => c.propietario },
    { key: "cliente", header: "Cliente", render: (c) => c.cliente },
    { key: "inicio", header: "Inicio", render: (c) => formatDate(c.fechaInicio), sortValue: (c) => c.fechaInicio.toISOString() },
    { key: "final", header: "Finalización", render: (c) => formatDate(c.fechaFinal) },
    { key: "estado", header: "Estado", render: (c) => c.estado },
    {
      key: "acciones",
      header: "",
      render: (c) => <DeleteButton action={deleteComodato.bind(null, c.activoId)} confirmMessage={`¿Finalizar el comodato de ${c.activo.codigo}?`} label="Finalizar" />,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(c) => `${c.activo.codigo} ${c.propietario} ${c.cliente}`}
      emptyTitle="Sin comodatos"
      emptyDescription="Registrá activos cedidos en comodato para llevar el control contractual."
    />
  );
}
