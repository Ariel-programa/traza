"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    return { error: "Credenciales inválidas." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Credenciales inválidas." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    rol: user.rol,
    nombre: `${user.nombre} ${user.apellido}`.trim(),
    empresaId: user.empresaId,
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      empresaId: user.empresaId,
      accion: "LOGIN",
      entidad: "User",
      entidadId: user.id,
    },
  });

  redirect(next.startsWith("/") ? next : "/dashboard");
}
