"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { EstadoProveedor } from "@prisma/client";

const schema = z.object({
  empresaId: z.string().min(1),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  cuit: z.string().optional(),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  servicio: z.string().min(2, "Indicá el servicio que ofrece"),
  estado: z.nativeEnum(EstadoProveedor),
  observaciones: z.string().optional(),
});

export type ProveedorFormState = { error?: string };

export async function createProveedor(_prev: ProveedorFormState, formData: FormData): Promise<ProveedorFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para crear proveedores en esa empresa." };
  }

  const proveedor = await prisma.proveedor.create({
    data: {
      empresaId: data.empresaId,
      nombre: data.nombre,
      cuit: data.cuit || null,
      contacto: data.contacto || null,
      telefono: data.telefono || null,
      email: data.email || null,
      servicio: data.servicio,
      estado: data.estado,
      observaciones: data.observaciones || null,
    },
  });

  await logAudit(session, "CREAR", "Proveedor", proveedor.id, proveedor.nombre);
  revalidatePath("/proveedores");
  redirect(`/proveedores/${proveedor.id}`);
}

export async function updateProveedor(id: string, _prev: ProveedorFormState, formData: FormData): Promise<ProveedorFormState> {
  const session = await requireSession();
  const existing = await prisma.proveedor.findUnique({ where: { id } });
  if (!existing) return { error: "El proveedor no existe." };
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para editar este proveedor." };
  }
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  await prisma.proveedor.update({
    where: { id },
    data: {
      nombre: data.nombre,
      cuit: data.cuit || null,
      contacto: data.contacto || null,
      telefono: data.telefono || null,
      email: data.email || null,
      servicio: data.servicio,
      estado: data.estado,
      observaciones: data.observaciones || null,
    },
  });

  await logAudit(session, "EDITAR", "Proveedor", id, data.nombre);
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  redirect(`/proveedores/${id}`);
}

export async function deleteProveedor(id: string) {
  const session = await requireSession();
  const existing = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      _count: { select: { activos: true, mantenimientos: true, gastos: true, documentos: true, users: true } },
    },
  });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este proveedor.");
  }
  const { activos, mantenimientos, gastos, documentos, users } = existing._count;
  if (activos > 0 || mantenimientos > 0 || gastos > 0 || documentos > 0 || users > 0) {
    redirect(`/proveedores/${id}?error=tiene-historial`);
  }
  await prisma.proveedor.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Proveedor", id, existing.nombre);
  revalidatePath("/proveedores");
  redirect("/proveedores");
}
