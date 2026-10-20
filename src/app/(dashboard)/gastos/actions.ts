"use server";

import { z } from "zod";
import { fecha, numero, urlOpcional } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { logAudit } from "@/lib/audit";
import { CategoriaGasto } from "@prisma/client";

const schema = z.object({
  empresaId: z.string().min(1),
  fecha: fecha(),
  categoria: z.nativeEnum(CategoriaGasto),
  importe: numero("Indicá el importe"),
  proveedorId: z.string().optional(),
  activoId: z.string().optional(),
  vehiculoId: z.string().optional(),
  trasladoId: z.string().optional(),
  comprobanteUrl: urlOpcional(),
  observaciones: z.string().optional(),
});

export type GastoFormState = { error?: string };

export async function createGasto(_prev: GastoFormState, formData: FormData): Promise<GastoFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para registrar gastos en esa empresa." };
  }

  if (data.proveedorId) {
    const p = await prisma.proveedor.findUnique({ where: { id: data.proveedorId } });
    if (!p || p.empresaId !== data.empresaId) return { error: "El proveedor seleccionado no pertenece a esta empresa." };
  }
  if (data.activoId) {
    const a = await prisma.activo.findUnique({ where: { id: data.activoId } });
    if (!a || a.empresaId !== data.empresaId) return { error: "El activo seleccionado no pertenece a esta empresa." };
  }
  if (data.vehiculoId) {
    const v = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
    if (!v || v.empresaId !== data.empresaId) return { error: "El vehículo seleccionado no pertenece a esta empresa." };
  }
  if (data.trasladoId) {
    const t = await prisma.traslado.findUnique({ where: { id: data.trasladoId } });
    if (!t || t.empresaId !== data.empresaId) return { error: "El traslado seleccionado no pertenece a esta empresa." };
  }

  const gasto = await prisma.gasto.create({
    data: {
      empresaId: data.empresaId,
      fecha: new Date(data.fecha),
      categoria: data.categoria,
      importe: Number(data.importe),
      proveedorId: data.proveedorId || null,
      activoId: data.activoId || null,
      vehiculoId: data.vehiculoId || null,
      trasladoId: data.trasladoId || null,
      comprobanteUrl: data.comprobanteUrl || null,
      observaciones: data.observaciones || null,
    },
  });

  await logAudit(session, "CREAR", "Gasto", gasto.id, data.categoria);
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  if (data.trasladoId) {
    revalidatePath(`/logistica/${data.trasladoId}`);
    redirect(`/logistica/${data.trasladoId}`);
  }
  redirect("/gastos");
}

export async function deleteGasto(id: string) {
  const session = await requireSession();
  if (!puedeEliminar(session.rol)) throw new Error("No tenés permiso para eliminar registros.");
  const existing = await prisma.gasto.findUnique({ where: { id } });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este gasto.");
  }
  await prisma.gasto.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Gasto", id, existing.categoria);
  revalidatePath("/gastos");
  redirect("/gastos");
}
