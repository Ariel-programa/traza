"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, tipoActivoLabel } from "@/lib/format";
import { QrPreview } from "./qr-preview";
import type { Activo, Empresa, Ubicacion, Proveedor } from "@prisma/client";

type Row = Activo & { empresa: Empresa; ubicacion: Ubicacion | null; proveedor: Proveedor | null };

export function ActivosTable({ activos, showEmpresa }: { activos: Row[]; showEmpresa: boolean }) {
  const columns: Column<Row>[] = [
    {
      key: "codigo",
      header: "Código",
      render: (a) => <span className="font-mono text-xs font-medium">{a.codigo}</span>,
      sortValue: (a) => a.codigo,
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (a) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{a.nombre}</p>
          <p className="text-xs text-[var(--text-muted)]">{a.marca} {a.modelo}</p>
        </div>
      ),
      sortValue: (a) => a.nombre,
    },
    { key: "tipo", header: "Tipo", render: (a) => tipoActivoLabel(a.tipo), csvValue: (a) => tipoActivoLabel(a.tipo) },
    ...(showEmpresa
      ? [{ key: "empresa", header: "Empresa", render: (a: Row) => a.empresa.nombre } as Column<Row>]
      : []),
    { key: "ubicacion", header: "Ubicación", render: (a) => a.ubicacion?.nombre ?? "—", csvValue: (a) => a.ubicacion?.nombre ?? "" },
    { key: "proveedor", header: "Proveedor", render: (a) => a.proveedor?.nombre ?? "—", csvValue: (a) => a.proveedor?.nombre ?? "" },
    {
      key: "vencimiento",
      header: "Próximo vencimiento",
      render: (a) => formatDate(a.proximoVencimiento),
      sortValue: (a) => (a.proximoVencimiento ? new Date(a.proximoVencimiento).toISOString() : ""),
      csvValue: (a) => formatDate(a.proximoVencimiento),
    },
    { key: "estado", header: "Estado", render: (a) => <StatusBadge estado={a.estado} />, csvValue: (a) => a.estado },
    { key: "qr", header: "QR", render: (a) => <QrPreview activo={a} />, csvValue: () => "" },
  ];

  return (
    <DataTable
      data={activos}
      columns={columns}
      searchKeys={(a) => `${a.codigo} ${a.nombre} ${a.marca ?? ""} ${a.numeroSerie ?? ""}`}
      filters={[
        {
          key: "estado",
          label: "Estado",
          options: [
            { label: "Vigente", value: "VIGENTE" },
            { label: "Próximo a vencer", value: "PROXIMO_A_VENCER" },
            { label: "Vencido", value: "VENCIDO" },
            { label: "En mantenimiento", value: "EN_MANTENIMIENTO" },
            { label: "Fuera de servicio", value: "FUERA_DE_SERVICIO" },
            { label: "Retirado", value: "RETIRADO" },
          ],
          predicate: (a, v) => a.estado === v,
        },
      ]}
      rowHref={(a) => `/activos/${a.id}`}
      exportFilename="activos-traza"
      emptyTitle="No hay activos cargados"
      emptyDescription="Creá el primer activo para empezar a trazar su mantenimiento y vencimientos."
    />
  );
}
