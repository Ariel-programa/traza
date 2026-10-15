"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const empresaSchema = z.object({
  nombre: z.string().min(2),
  cuit: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
});

export type ConfigFormState = { error?: string; success?: string };

export async function updateEmpresa(_prev: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") return { error: "No tenés permiso." };
  if (!session.empresaId) return { error: "Tu usuario no está asociado a una empresa." };

  const parsed = empresaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  await prisma.empresa.update({
    where: { id: session.empresaId },
    data: { nombre: data.nombre, cuit: data.cuit || null, email: data.email || null, telefono: data.telefono || null },
  });

  await logAudit(session, "EDITAR", "Empresa", session.empresaId, "Datos de empresa actualizados");
  revalidatePath("/configuracion");
  return { success: "Datos actualizados correctamente." };
}

const webhookSchema = z.object({
  evento: z.string().min(1),
  url: z.string().url("Ingresá una URL válida"),
});

export async function crearWebhook(_prev: ConfigFormState, formData: FormData): Promise<ConfigFormState> {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") return { error: "No tenés permiso." };

  const parsed = webhookSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.webhookConfig.create({
    data: { empresaId: session.empresaId, evento: parsed.data.evento, url: parsed.data.url, activo: true },
  });

  revalidatePath("/configuracion");
  return { success: "Webhook agregado." };
}

export async function toggleWebhook(id: string) {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") throw new Error("No tenés permiso.");
  const webhook = await prisma.webhookConfig.findUnique({ where: { id } });
  if (!webhook) return;
  if (session.rol !== "ADMIN" && webhook.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso sobre este webhook.");
  }
  await prisma.webhookConfig.update({ where: { id }, data: { activo: !webhook.activo } });
  revalidatePath("/configuracion");
}

export async function eliminarWebhook(id: string) {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") throw new Error("No tenés permiso.");
  const webhook = await prisma.webhookConfig.findUnique({ where: { id } });
  if (!webhook) return;
  if (session.rol !== "ADMIN" && webhook.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso sobre este webhook.");
  }
  await prisma.webhookConfig.delete({ where: { id } });
  revalidatePath("/configuracion");
}
