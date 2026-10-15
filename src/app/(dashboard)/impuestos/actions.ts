"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { calcularEstadoImpuesto } from "@/lib/vencimientos";

const schema = z.object({
  empresaId: z.string().min(1),
  nombre: z.string().min(2, "Indicá el nombre del impuesto"),
  vehiculoId: z.string().optional(),
  activoId: z.string().optional(),
  importe: z.string().min(1, "Indicá el importe"),
  vencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  fechaPago: z.string().optional(),
  comprobanteUrl: z.string().optional(),
  observaciones: z.string().optional(),
});

export type ImpuestoFormState = { error?: string };

export async function createImpuesto(_prev: ImpuestoFormState, formData: FormData): Promise<ImpuestoFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para registrar impuestos en esa empresa." };
  }

  if (data.vehiculoId) {
    const v = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
    if (!v || v.empresaId !== data.empresaId) return { error: "El vehículo seleccionado no pertenece a esta empresa." };
  }
  if (data.activoId) {
    const a = await prisma.activo.findUnique({ where: { id: data.activoId } });
    if (!a || a.empresaId !== data.empresaId) return { error: "El activo seleccionado no pertenece a esta empresa." };
  }

  const vencimiento = new Date(data.vencimiento);
  const fechaPago = data.fechaPago ? new Date(data.fechaPago) : null;

  const impuesto = await prisma.impuesto.create({
    data: {
      empresaId: data.empresaId,
      nombre: data.nombre,
      vehiculoId: data.vehiculoId || null,
      activoId: data.activoId || null,
      importe: Number(data.importe),
      vencimiento,
      fechaPago,
      estado: calcularEstadoImpuesto(vencimiento, fechaPago),
      comprobanteUrl: data.comprobanteUrl || null,
      observaciones: data.observaciones || null,
    },
  });

  await logAudit(session, "CREAR", "Impuesto", impuesto.id, data.nombre);
  revalidatePath("/impuestos");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  redirect("/impuestos");
}

export async function updateImpuesto(id: string, _prev: ImpuestoFormState, formData: FormData): Promise<ImpuestoFormState> {
  const session = await requireSession();
  const existing = await prisma.impuesto.findUnique({ where: { id } });
  if (!existing) return { error: "El impuesto no existe." };
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para editar este impuesto." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  if (data.vehiculoId) {
    const v = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
    if (!v || v.empresaId !== existing.empresaId) return { error: "El vehículo seleccionado no pertenece a esta empresa." };
  }
  if (data.activoId) {
    const a = await prisma.activo.findUnique({ where: { id: data.activoId } });
    if (!a || a.empresaId !== existing.empresaId) return { error: "El activo seleccionado no pertenece a esta empresa." };
  }

  const vencimiento = new Date(data.vencimiento);
  const fechaPago = data.fechaPago ? new Date(data.fechaPago) : null;

  await prisma.impuesto.update({
    where: { id },
    data: {
      nombre: data.nombre,
      vehiculoId: data.vehiculoId || null,
      activoId: data.activoId || null,
      importe: Number(data.importe),
      vencimiento,
      fechaPago,
      estado: calcularEstadoImpuesto(vencimiento, fechaPago),
      comprobanteUrl: data.comprobanteUrl || null,
      observaciones: data.observaciones || null,
    },
  });

  await logAudit(session, "EDITAR", "Impuesto", id, data.nombre);
  revalidatePath("/impuestos");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  redirect("/impuestos");
}

export async function marcarImpuestoPagado(id: string) {
  const session = await requireSession();
  const existing = await prisma.impuesto.findUnique({ where: { id } });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso sobre este impuesto.");
  }
  await prisma.impuesto.update({
    where: { id },
    data: { estado: "PAGADO", fechaPago: new Date() },
  });
  await logAudit(session, "EDITAR", "Impuesto", id, `${existing.nombre} -> pagado`);
  revalidatePath("/impuestos");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
}

export async function deleteImpuesto(id: string) {
  const session = await requireSession();
  const existing = await prisma.impuesto.findUnique({ where: { id } });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este impuesto.");
  }
  await prisma.impuesto.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Impuesto", id, existing.nombre);
  revalidatePath("/impuestos");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  redirect("/impuestos");
}
