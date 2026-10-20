"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { deleteDocumento } from "./actions";
import { Pencil } from "lucide-react";

export type DocumentoRow = {
  id: string;
  entidadTipo: string;
  tipo: string;
  numero: string | null;
  fechaEmision: string | null;
  vencimiento: string | null;
  estado: string;
  entidadLabel: string;
};

const ENTIDAD_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  VEHICULO: "Vehículo",
  CONDUCTOR: "Conductor",
  PROVEEDOR: "Proveedor",
  EMPRESA: "Empresa",
};

export function DocumentosTable({ data, puedeEliminar }: { data: DocumentoRow[]; puedeEliminar: boolean }) {
  const columns: Column<DocumentoRow>[] = [
    { key: "tipo", header: "Documento", render: (d) => <span className="font-medium">{d.tipo}</span>, sortValue: (d) => d.tipo },
    { key: "entidadTipo", header: "Aplica a", render: (d) => ENTIDAD_LABEL[d.entidadTipo] ?? d.entidadTipo },
    { key: "entidadLabel", header: "Registro", render: (d) => d.entidadLabel },
    { key: "numero", header: "Número", render: (d) => d.numero ?? "—" },
    { key: "vencimiento", header: "Vencimiento", render: (d) => formatDate(d.vencimiento), sortValue: (d) => d.vencimiento ?? "" },
    { key: "estado", header: "Estado", render: (d) => <StatusBadge estado={d.estado} /> },
    {
      key: "acciones",
      header: "",
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/documentacion/${d.id}/editar`} aria-label={`Editar ${d.tipo}`}><Pencil className="h-3.5 w-3.5" /></Link>
          </Button>
          {puedeEliminar && <DeleteButton action={deleteDocumento.bind(null, d.id)} confirmMessage={`¿Eliminar el documento "${d.tipo}"?`} label="" />}
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(d) => `${d.tipo} ${d.entidadLabel} ${d.numero ?? ""}`}
      filters={[
        {
          key: "entidadTipo",
          label: "Aplica a",
          options: Object.entries(ENTIDAD_LABEL).map(([value, label]) => ({ value, label })),
          predicate: (d, v) => d.entidadTipo === v,
        },
        {
          key: "estado",
          label: "Estado",
          options: [
            { label: "Vigente", value: "VIGENTE" },
            { label: "Próximo a vencer", value: "PROXIMO_A_VENCER" },
            { label: "Vencido", value: "VENCIDO" },
          ],
          predicate: (d, v) => d.estado === v,
        },
      ]}
      emptyTitle="Sin documentos"
      emptyDescription="Cargá seguros, VTV, habilitaciones y otros documentos con vencimiento."
    />
  );
}
