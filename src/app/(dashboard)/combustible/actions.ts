"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  vehiculoId: z.string().min(1, "Seleccioná un vehículo"),
  conductorId: z.string().optional(),
  fecha: z.string().min(1),
  estacion: z.string().optional(),
  litros: z.string().min(1, "Indicá los litros cargados"),
  precioLitro: z.string().min(1, "Indicá el precio por litro"),
  kilometraje: z.string().optional(),
  fotoTicket: z.string().optional(),
});

export type CombustibleFormState = { error?: string };

export async function createCombustibleCarga(_prev: CombustibleFormState, formData: FormData): Promise<CombustibleFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
  if (!vehiculo) return { error: "El vehículo no existe." };
  if (session.rol !== "ADMIN" && vehiculo.empresaId !== session.empresaId) {
    return { error: "No tenés permiso sobre este vehículo." };
  }

  if (data.conductorId) {
    const c = await prisma.conductor.findUnique({ where: { id: data.conductorId } });
    if (!c || c.empresaId !== vehiculo.empresaId) return { error: "El conductor seleccionado no pertenece a esta empresa." };
  }

  const litros = Number(data.litros);
  const precioLitro = Number(data.precioLitro);

  const carga = await prisma.combustibleCarga.create({
    data: {
      vehiculoId: data.vehiculoId,
      conductorId: data.conductorId || null,
      fecha: new Date(data.fecha),
      estacion: data.estacion || null,
      litros,
      precioLitro,
      importe: litros * precioLitro,
      kilometraje: data.kilometraje ? Number(data.kilometraje) : null,
      fotoTicket: data.fotoTicket || null,
    },
  });

  if (data.kilometraje) {
    await prisma.vehiculo.update({ where: { id: data.vehiculoId }, data: { kilometraje: Number(data.kilometraje) } });
  }

  await logAudit(session, "CREAR", "CombustibleCarga", carga.id, vehiculo.patente);
  revalidatePath("/combustible");
  revalidatePath("/dashboard");
  redirect("/combustible");
}

export async function deleteCombustibleCarga(id: string) {
  const session = await requireSession();
  const carga = await prisma.combustibleCarga.findUnique({ where: { id }, include: { vehiculo: true } });
  if (!carga) return;
  if (session.rol !== "ADMIN" && carga.vehiculo.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar esta carga.");
  }
  await prisma.combustibleCarga.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "CombustibleCarga", id, carga.vehiculo.patente);
  revalidatePath("/combustible");
  redirect("/combustible");
}
