"use server";

import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { getClientIp, loginBloqueado, registrarLoginFallido } from "@/lib/rate-limit";
import { destinoSeguro } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

// Hash bcrypt de una contraseña descartable: se compara contra él cuando el
// email no existe, para que la respuesta tarde lo mismo y no permita
// enumerar cuentas por tiempo de respuesta.
const DUMMY_HASH = "$2b$12$D2XQTEXRMMp1BYml0sSBN.y6IFbPXPza1UBhXn.VhaecpGJZrd2sK";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }
  if (email.length > 254 || password.length > 128) {
    return { error: "Credenciales inválidas." };
  }

  const ip = await getClientIp();
  if (await loginBloqueado(email, ip)) {
    return { error: "Demasiados intentos fallidos. Esperá 15 minutos y volvé a intentar." };
  }

  const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.activo || !valid) {
    await registrarLoginFallido(email, ip, user?.id);
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

  redirect(destinoSeguro(next));
}
