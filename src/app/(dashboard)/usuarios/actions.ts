"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { verificarLimiteUsuarios } from "@/lib/plan-limits";
import { passwordSchema, passwordContieneEmail } from "@/lib/password-policy";
import { Rol } from "@prisma/client";

const schema = z.object({
  empresaId: z.string().optional(),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  email: z.string().trim().email("Ingresá un email válido").max(254),
  password: passwordSchema,
  rol: z.nativeEnum(Rol),
});

export type UsuarioFormState = { error?: string };

export async function createUsuario(_prev: UsuarioFormState, formData: FormData): Promise<UsuarioFormState> {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") {
    return { error: "No tenés permiso para crear usuarios." };
  }
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (passwordContieneEmail(data.password, data.email)) {
    return { error: "La contraseña no puede contener tu nombre de usuario del email." };
  }

  const empresaId = session.rol === "ADMIN" ? data.empresaId || null : session.empresaId;
  if (session.rol !== "ADMIN" && data.rol !== "TECNICO" && data.rol !== "CONDUCTOR" && data.rol !== "PROVEEDOR" && data.rol !== "EMPRESA") {
    return { error: "No podés asignar ese rol." };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) return { error: "Ya existe un usuario con ese email." };

  const errorLimite = await verificarLimiteUsuarios(empresaId);
  if (errorLimite) return { error: errorLimite };

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      empresaId,
      activo: true,
    },
  });

  await logAudit(session, "CREAR", "User", user.id, user.email);
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function toggleUsuarioActivo(id: string) {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") throw new Error("No tenés permiso.");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  if (session.rol !== "ADMIN" && user.empresaId !== session.empresaId) throw new Error("No tenés permiso.");
  await prisma.user.update({ where: { id }, data: { activo: !user.activo } });
  await logAudit(session, user.activo ? "DESACTIVAR" : "ACTIVAR", "User", id, user.email);
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
