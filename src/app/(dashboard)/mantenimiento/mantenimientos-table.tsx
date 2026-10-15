"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatDate, tipoMantenimientoLabel } from "@/lib/format";
import type { Mantenimiento, Activo, Proveedor, Tecnico } from "@prisma/client";

type Row = Mantenimiento & { activo: Activo; proveedor: Proveedor | null; tecnico: Tecnico | null };

export function MantenimientosTable({ data }: { data: Row[] }) {
  const columns: Column<Row>[] = [
    {
      key: "activo",
      header: "Activo",
      render: (m) => (
        <Link href={`/activos/${m.activoId}`} className="font-medium hover:text-[var(--brand)]">
          {m.activo.codigo} · {m.activo.nombre}
        </Link>
      ),
      sortValue: (m) => m.activo.codigo,
    },
    { key: "tipo", header: "Tipo", render: (m) => tipoMantenimientoLabel(m.tipo) },
    { key: "fecha", header: "Fecha", render: (m) => formatDate(m.fecha), sortValue: (m) => m.fecha.toISOString() },
    { key: "responsable", header: "Responsable", render: (m) => m.tecnico ? `${m.tecnico.nombre} ${m.tecnico.apellido}` : m.proveedor?.nombre ?? "—" },
    { key: "resultado", header: "Resultado", render: (m) => m.resultado ?? "—" },
    { key: "proxima", header: "Próxima fecha", render: (m) => formatDate(m.proximaFecha), sortValue: (m) => m.proximaFecha?.toISOString() ?? "" },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(m) => `${m.activo.codigo} ${m.activo.nombre} ${m.tecnico?.nombre ?? ""} ${m.proveedor?.nombre ?? ""}`}
      filters={[
        {
          key: "tipo",
          label: "Tipo",
          options: [
            "INSPECCION", "MANTENIMIENTO", "REPARACION", "RECARGA", "CALIBRACION", "INSTALACION", "RETIRO", "OTRO",
          ].map((t) => ({ label: tipoMantenimientoLabel(t), value: t })),
          predicate: (m, v) => m.tipo === v,
        },
      ]}
      exportFilename="mantenimiento-traza"
      emptyTitle="Sin mantenimientos"
      emptyDescription="Registrá la primera intervención sobre un activo."
    />
  );
}
