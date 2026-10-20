import { z } from "zod";

// Validadores reutilizables para los formularios (FormData llega todo como
// string). Siguen devolviendo string para que cada action convierta igual que
// antes, pero rechazan con un mensaje claro lo que antes terminaba en un
// error 500 de Prisma ("abc" como importe, una fecha inválida, etc.).

const esFechaValida = (v: string) => /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(new Date(v).getTime());
const esNumeroValido = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;

export const fecha = (mensaje = "Ingresá una fecha válida") =>
  z.string().min(1, mensaje).refine(esFechaValida, mensaje);

export const fechaOpcional = (mensaje = "Ingresá una fecha válida") =>
  z.string().refine((v) => v === "" || esFechaValida(v), mensaje).optional();

export const numero = (mensaje = "Ingresá un número válido") =>
  z.string().min(1, mensaje).refine(esNumeroValido, mensaje).refine((v) => Number(v) <= 1e12, "El valor es demasiado grande");

export const numeroOpcional = (mensaje = "Ingresá un número válido") =>
  z
    .string()
    .refine((v) => v === "" || (esNumeroValido(v) && Number(v) <= 1e12), mensaje)
    .optional();

export const enteroOpcional = (mensaje = "Ingresá un número entero válido") =>
  z
    .string()
    .refine((v) => v === "" || (esNumeroValido(v) && Number.isInteger(Number(v)) && Number(v) <= 2_000_000_000), mensaje)
    .optional();

// Enlaces cargados por el usuario: solo http(s). Evita guardar
// "javascript:..." que se ejecutaría si alguna vez se renderiza como <a href>.
export const urlOpcional = (mensaje = "Ingresá un enlace válido (https://...)") =>
  z
    .string()
    .trim()
    .max(2048, mensaje)
    .refine((v) => {
      if (v === "") return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, mensaje)
    .optional();

// Foto de ticket: la comprime el navegador a JPEG (scan-ticket-combustible.ts)
// y llega como data URL. El servidor no confía en eso: exige el prefijo de
// imagen, base64 válido, tamaño acotado y que los bytes reales sean un
// JPEG/PNG/WebP (magic bytes), no un archivo cualquiera renombrado.
export const FOTO_MAX_BYTES = 700 * 1024;
const FOTO_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

function esImagenReal(base64: string, tipo: string) {
  const bytes = Buffer.from(base64.slice(0, 32), "base64");
  if (tipo === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (tipo === "png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (tipo === "webp") return bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP";
  return false;
}

export const fotoOpcional = () =>
  z
    .string()
    .refine((v) => {
      if (v === "") return true;
      const m = FOTO_RE.exec(v);
      if (!m) return false;
      const [, tipo, base64] = m;
      return Math.floor((base64.length * 3) / 4) <= FOTO_MAX_BYTES && esImagenReal(base64, tipo);
    }, "La foto del ticket no es una imagen válida o supera el tamaño permitido.")
    .optional();
