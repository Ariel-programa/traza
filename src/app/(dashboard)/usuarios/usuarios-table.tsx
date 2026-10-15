"use client";

import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { toggleUsuarioActivo } from "./actions";
import type { User, Empresa } from "@prisma/client";

type Row = User & { empresa: Empresa | null };

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador", EMPRESA: "Empresa", PROVEEDOR: "Proveedor", TECNICO: "Técnico", CONDUCTOR: "Conductor",
};

export function UsuariosTable({ data, showEmpresa }: { data: Row[]; showEmpresa: boolean }) {
  const columns: Column<Row>[] = [
    { key: "nombre", header: "Nombre", render: (u) => <span className="font-medium">{u.nombre} {u.apellido}</span>, sortValue: (u) => u.apellido },
    { key: "email", header: "Email", render: (u) => <span className="font-mono text-xs">{u.email}</span> },
    { key: "rol", header: "Rol", render: (u) => ROL_LABEL[u.rol] ?? u.rol },
    ...(showEmpresa ? [{ key: "empresa", header: "Empresa", render: (u: Row) => u.empresa?.nombre ?? "—" } as Column<Row>] : []),
    { key: "estado", header: "Estado", render: (u) => <StatusBadge estado={u.activo ? "ACTIVO" : "INACTIVO"} /> },
    {
      key: "acciones",
      header: "",
      render: (u) => (
        <form action={toggleUsuarioActivo.bind(null, u.id)}>
          <Button type="submit" size="sm" variant="secondary">{u.activo ? "Desactivar" : "Activar"}</Button>
        </form>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKeys={(u) => `${u.nombre} ${u.apellido} ${u.email}`}
      filters={[
        {
          key: "rol",
          label: "Rol",
          options: Object.entries(ROL_LABEL).map(([value, label]) => ({ value, label })),
          predicate: (u, v) => u.rol === v,
        },
      ]}
      emptyTitle="Sin usuarios"
      emptyDescription="Creá el primer usuario adicional para tu equipo."
    />
  );
}
