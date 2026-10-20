"use server";

import { z } from "zod";
import { fecha, fechaOpcional } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { TipoMantenimiento } from "@prisma/client";
import { calcularEstadoVencimiento } from "@/lib/vencimientos";
import { triggerWebhooks } from "@/lib/webhooks";

const schema = z.object({
  activoId: z.string().min(1, "Seleccioná un activo"),
  fecha: fecha("La fecha es obligatoria"),
  tipo: z.nativeEnum(TipoMantenimiento),
  proveedorId: z.string().optional(),
  tecnicoId: z.string().optional(),
  resultado: z.string().optional(),
  observaciones: z.string().optional(),
  proximaFecha: fechaOpcional(),
});

export type MantenimientoFormState = { error?: string };

const ESTADO_MAP = {
  VIGENTE: "VIGENTE",
  PROXIMO: "PROXIMO_A_VENCER",
  VENCIDO: "VENCIDO",
  SIN_FECHA: "VIGENTE",
} as const;

export async function createMantenimiento(
  _prev: MantenimientoFormState,
  formData: FormData
): Promise<MantenimientoFormState> {
  const session = await requireSession();
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  const activo = await prisma.activo.findUnique({ where: { id: data.activoId } });
  if (!activo) return { error: "El activo seleccionado no existe." };
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) {
    return { error: "No tenés permiso sobre este activo." };
  }

  if (data.proveedorId) {
    const p = await prisma.proveedor.findUnique({ where: { id: data.proveedorId } });
    if (!p || p.empresaId !== activo.empresaId) return { error: "El proveedor seleccionado no pertenece a esta empresa." };
  }
  if (data.tecnicoId) {
    const t = await prisma.tecnico.findUnique({ where: { id: data.tecnicoId } });
    if (!t || t.empresaId !== activo.empresaId) return { error: "El técnico seleccionado no pertenece a esta empresa." };
  }

  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      activoId: data.activoId,
      fecha: new Date(data.fecha),
      tipo: data.tipo,
      proveedorId: data.proveedorId || null,
      tecnicoId: data.tecnicoId || null,
      resultado: data.resultado || null,
      observaciones: data.observaciones || null,
      proximaFecha: data.proximaFecha ? new Date(data.proximaFecha) : null,
    },
  });

  if (data.proximaFecha) {
    const nuevoVencimiento = new Date(data.proximaFecha);
    await prisma.activo.update({
      where: { id: data.activoId },
      data: {
        ultimaInspeccion: new Date(data.fecha),
        proximoVencimiento: nuevoVencimiento,
        estado: ESTADO_MAP[calcularEstadoVencimiento(nuevoVencimiento)],
      },
    });
  } else {
    await prisma.activo.update({
      where: { id: data.activoId },
      data: { ultimaInspeccion: new Date(data.fecha) },
    });
  }

  await logAudit(session, "CREAR", "Mantenimiento", mantenimiento.id, `${activo.codigo}`);
  await triggerWebhooks("MANTENIMIENTO_REALIZADO", activo.empresaId, {
    activoCodigo: activo.codigo,
    activoNombre: activo.nombre,
    tipo: data.tipo,
    fecha: data.fecha,
    proximaFecha: data.proximaFecha ?? null,
  });
  revalidatePath("/mantenimiento");
  revalidatePath(`/activos/${data.activoId}`);
  revalidatePath("/dashboard");
  redirect(`/activos/${data.activoId}`);
}
