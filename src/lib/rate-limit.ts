import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Throttling de login persistido en AuditLog: cada intento fallido queda
// registrado como LOGIN_FALLIDO (entidadId = email, detalle = ip:<ip>), así el
// límite se comparte entre instancias del servidor y sobrevive reinicios.
// Se bloquea por identidad (email) además de por IP, para frenar tanto la
// fuerza bruta sobre una cuenta como el credential stuffing desde una IP.

const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FALLOS_POR_EMAIL = 5;
export const MAX_FALLOS_POR_IP = 20;

const ACCION = "LOGIN_FALLIDO";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Detrás de Vercel / un reverse proxy, el primer valor de x-forwarded-for es
  // la IP real del cliente. Sin proxy delante, este header es falsificable:
  // el límite por email sigue protegiendo la cuenta igual.
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "desconocida";
}

export async function loginBloqueado(email: string, ip: string): Promise<boolean> {
  const desde = new Date(Date.now() - WINDOW_MS);
  const [porEmail, porIp] = await Promise.all([
    prisma.auditLog.count({ where: { accion: ACCION, entidadId: email, fecha: { gte: desde } } }),
    prisma.auditLog.count({ where: { accion: ACCION, detalle: `ip:${ip}`, fecha: { gte: desde } } }),
  ]);
  return porEmail >= MAX_FALLOS_POR_EMAIL || porIp >= MAX_FALLOS_POR_IP;
}

export async function registrarLoginFallido(email: string, ip: string, userId?: string) {
  await prisma.auditLog.create({
    data: { accion: ACCION, entidad: "Login", entidadId: email, detalle: `ip:${ip}`, userId: userId ?? null },
  });
}
