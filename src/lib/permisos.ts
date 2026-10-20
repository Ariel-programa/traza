import type { Rol } from "@prisma/client";

// Borrar registros es irreversible: queda reservado a quien administra la
// empresa. Técnicos, conductores y proveedores pueden cargar y editar, pero
// no eliminar. El chequeo real está en cada server action; ocultar el botón
// en la UI es solo comodidad.
const ROLES_QUE_ELIMINAN: readonly Rol[] = ["ADMIN", "EMPRESA"];

export function puedeEliminar(rol: Rol) {
  return ROLES_QUE_ELIMINAN.includes(rol);
}
