"use server";

import { z } from "zod";
import { fecha, fechaOpcional } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { logAudit } from "@/lib/audit";
import { Modalidad } from "@prisma/client";

const schema = z.object({
  activoId: z.string().min(1, "Seleccioná un activo"),
  propietario: z.string().min(2, "Indicá el propietario"),
  cliente: z.string().min(2, "Indicá el cliente"),
  fechaInicio: fecha("La fecha de inicio es obligatoria"),
  fechaFinal: fechaOpcional(),
  ubicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

export type ComodatoFormState = { error?: string };

export async function createComodato(_prev: ComodatoFormState, formData: FormData): Promise<ComodatoFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const activo = await prisma.activo.findUnique({ where: { id: data.activoId } });
  if (!activo) return { error: "El activo no existe." };
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) {
    return { error: "No tenés permiso sobre este activo." };
  }
  const existente = await prisma.comodato.findUnique({ where: { activoId: data.activoId } });
  if (existente) return { error: "Este activo ya tiene un comodato registrado." };

  await prisma.$transaction([
    prisma.comodato.create({
      data: {
        activoId: data.activoId,
        propietario: data.propietario,
        cliente: data.cliente,
        fechaInicio: new Date(data.fechaInicio),
        fechaFinal: data.fechaFinal ? new Date(data.fechaFinal) : null,
        estado: "Vigente",
        ubicacion: data.ubicacion || null,
        observaciones: data.observaciones || null,
      },
    }),
    prisma.activo.update({ where: { id: data.activoId }, data: { modalidad: Modalidad.COMODATO } }),
  ]);

  await logAudit(session, "CREAR", "Comodato", data.activoId, `${activo.codigo}`);
  revalidatePath("/comodatos");
  revalidatePath(`/activos/${data.activoId}`);
  redirect("/comodatos");
}

export async function deleteComodato(activoId: string) {
  const session = await requireSession();
  if (!puedeEliminar(session.rol)) throw new Error("No tenés permiso para eliminar registros.");
  const activo = await prisma.activo.findUnique({ where: { id: activoId } });
  if (!activo) return;
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso sobre este activo.");
  }
  await prisma.$transaction([
    prisma.comodato.delete({ where: { activoId } }),
    prisma.activo.update({ where: { id: activoId }, data: { modalidad: Modalidad.PROPIO } }),
  ]);
  await logAudit(session, "ELIMINAR", "Comodato", activoId, activo.codigo);
  revalidatePath("/comodatos");
  revalidatePath(`/activos/${activoId}`);
  redirect("/comodatos");
}
