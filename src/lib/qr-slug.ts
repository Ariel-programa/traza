import { randomBytes } from "node:crypto";

// Slug de la ficha pública del QR. Lleva un sufijo aleatorio (64 bits) para
// que no se pueda adivinar: con solo el código ("mf-00001") cualquiera podría
// recorrer /public/activo/mf-00001, mf-00002... y listar los activos,
// empresas y ubicaciones de todos los clientes.
export function generarQrSlug(codigo: string) {
  return `${codigo.toLowerCase()}-${randomBytes(8).toString("hex")}`;
}
