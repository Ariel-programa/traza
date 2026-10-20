"use server";

import { z } from "zod";
import { fecha } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { logAudit } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { EstadoTraslado } from "@prisma/client";

const schema = z.object({
  empresaId: z.string().min(1),
  fecha: fecha(),
  origen: z.string().min(1, "Indicá el origen"),
  destino: z.string().min(1, "Indicá el destino"),
  vehiculoId: z.string().optional(),
  conductorId: z.string().optional(),
  cliente: z.string().optional(),
  estado: z.nativeEnum(EstadoTraslado),
  observaciones: z.string().optional(),
});

export type TrasladoFormState = { error?: string };

async function generarNumero() {
  const count = await prisma.traslado.count();
  let intento = 0;
  while (intento < 50) {
    const numero = `TR-${String(count + 1 + intento).padStart(5, "0")}`;
    const exists = await prisma.traslado.findUnique({ where: { numero } });
    if (!exists) return numero;
    intento++;
  }
  return `TR-${Date.now()}`;
}

export async function createTraslado(_prev: TrasladoFormState, formData: FormData): Promise<TrasladoFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para crear traslados en esa empresa." };
  }

  if (data.vehiculoId) {
    const v = await prisma.vehiculo.findUnique({ where: { id: data.vehiculoId } });
    if (!v || v.empresaId !== data.empresaId) return { error: "El vehículo seleccionado no pertenece a esta empresa." };
  }
  if (data.conductorId) {
    const c = await prisma.conductor.findUnique({ where: { id: data.conductorId } });
    if (!c || c.empresaId !== data.empresaId) return { error: "El conductor seleccionado no pertenece a esta empresa." };
  }

  const numero = await generarNumero();
  const traslado = await prisma.traslado.create({
    data: {
      numero,
      empresaId: data.empresaId,
      fecha: new Date(data.fecha),
      origen: data.origen,
      destino: data.destino,
      vehiculoId: data.vehiculoId || null,
      conductorId: data.conductorId || null,
      cliente: data.cliente || null,
      estado: data.estado,
      observaciones: data.observaciones || null,
    },
  });

  if (data.vehiculoId && data.estado === EstadoTraslado.EN_CURSO) {
    await prisma.vehiculo.update({ where: { id: data.vehiculoId }, data: { estado: "EN_VIAJE" } });
  }

  await logAudit(session, "CREAR", "Traslado", traslado.id, traslado.numero);
  await triggerWebhooks("NUEVO_TRASLADO", data.empresaId, {
    numero: traslado.numero,
    origen: data.origen,
    destino: data.destino,
    fecha: data.fecha,
  });
  revalidatePath("/logistica");
  revalidatePath("/dashboard");
  redirect(`/logistica/${traslado.id}`);
}

export async function updateEstadoTraslado(id: string, estado: EstadoTraslado) {
  const session = await requireSession();
  const traslado = await prisma.traslado.findUnique({ where: { id } });
  if (!traslado) return;
  if (session.rol !== "ADMIN" && traslado.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso sobre este traslado.");
  }
  await prisma.traslado.update({ where: { id }, data: { estado } });
  if (traslado.vehiculoId) {
    if (estado === EstadoTraslado.EN_CURSO) {
      await prisma.vehiculo.update({ where: { id: traslado.vehiculoId }, data: { estado: "EN_VIAJE" } });
    } else if (estado === EstadoTraslado.COMPLETADO || estado === EstadoTraslado.CANCELADO) {
      await prisma.vehiculo.update({ where: { id: traslado.vehiculoId }, data: { estado: "DISPONIBLE" } });
    }
  }
  await logAudit(session, "EDITAR", "Traslado", id, `estado -> ${estado}`);
  revalidatePath("/logistica");
  revalidatePath(`/logistica/${id}`);
  redirect(`/logistica/${id}`);
}

export async function deleteTraslado(id: string) {
  const session = await requireSession();
  if (!puedeEliminar(session.rol)) throw new Error("No tenés permiso para eliminar registros.");
  const existing = await prisma.traslado.findUnique({
    where: { id },
    include: { _count: { select: { gastos: true } } },
  });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este traslado.");
  }
  if (existing._count.gastos > 0) {
    redirect(`/logistica/${id}?error=tiene-historial`);
  }
  await prisma.traslado.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Traslado", id, existing.numero);
  revalidatePath("/logistica");
  redirect("/logistica");
}
