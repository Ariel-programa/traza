"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { verificarLimiteActivos } from "@/lib/plan-limits";
import { TipoActivo, Modalidad } from "@prisma/client";

const PREFIX: Record<string, string> = {
  MATAFUEGO: "MF",
  EQUIPO_MEDICO: "EQ",
  EQUIPO_INFORMATICO: "IN",
  HERRAMIENTA: "HE",
  MAQUINARIA: "MQ",
  ALARMA: "AL",
  EQUIPO_CONTRA_INCENDIO: "CI",
  EQUIPO_ELECTRICO: "EL",
  VEHICULO: "VE",
  OTRO: "OT",
};

async function generarCodigo(tipo: string) {
  const prefix = PREFIX[tipo] ?? "AC";
  let intento = 0;
  while (intento < 50) {
    const count = await prisma.activo.count({ where: { codigo: { startsWith: prefix + "-" } } });
    const numero = count + 1 + intento;
    const codigo = `${prefix}-${String(numero).padStart(5, "0")}`;
    const exists = await prisma.activo.findUnique({ where: { codigo } });
    if (!exists) return codigo;
    intento++;
  }
  return `${prefix}-${Date.now()}`;
}

const activoSchema = z.object({
  tipo: z.nativeEnum(TipoActivo),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  numeroSerie: z.string().optional(),
  empresaId: z.string().min(1, "Seleccioná una empresa"),
  ubicacionId: z.string().optional(),
  proveedorId: z.string().optional(),
  modalidad: z.nativeEnum(Modalidad),
  fechaAdquisicion: z.string().optional(),
  ultimaInspeccion: z.string().optional(),
  proximoVencimiento: z.string().optional(),
  observaciones: z.string().optional(),
  // atributos específicos por tipo
  tipoMatafuego: z.string().optional(),
  capacidadKg: z.string().optional(),
  subtipoMedico: z.string().optional(),
  responsableMedico: z.string().optional(),
});

export type ActivoFormState = { error?: string };

async function validarUbicacionYProveedor(data: z.infer<typeof activoSchema>, empresaId: string): Promise<string | null> {
  if (data.ubicacionId) {
    const u = await prisma.ubicacion.findUnique({ where: { id: data.ubicacionId } });
    if (!u || u.empresaId !== empresaId) return "La ubicación seleccionada no pertenece a esta empresa.";
  }
  if (data.proveedorId) {
    const p = await prisma.proveedor.findUnique({ where: { id: data.proveedorId } });
    if (!p || p.empresaId !== empresaId) return "El proveedor seleccionado no pertenece a esta empresa.";
  }
  return null;
}

function buildAtributos(data: z.infer<typeof activoSchema>) {
  if (data.tipo === TipoActivo.MATAFUEGO) {
    return JSON.stringify({
      tipoMatafuego: data.tipoMatafuego || undefined,
      capacidadKg: data.capacidadKg ? Number(data.capacidadKg) : undefined,
    });
  }
  if (data.tipo === TipoActivo.EQUIPO_MEDICO) {
    return JSON.stringify({
      subtipo: data.subtipoMedico || undefined,
      responsable: data.responsableMedico || undefined,
    });
  }
  return null;
}

export async function createActivo(_prev: ActivoFormState, formData: FormData): Promise<ActivoFormState> {
  const session = await requireSession();
  const raw = Object.fromEntries(formData.entries());
  const parsed = activoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para crear activos en esa empresa." };
  }

  const errorLimite = await verificarLimiteActivos(data.empresaId);
  if (errorLimite) return { error: errorLimite };

  const errorRelacion = await validarUbicacionYProveedor(data, data.empresaId);
  if (errorRelacion) return { error: errorRelacion };

  const codigo = await generarCodigo(data.tipo);

  const activo = await prisma.activo.create({
    data: {
      codigo,
      tipo: data.tipo,
      nombre: data.nombre,
      marca: data.marca || null,
      modelo: data.modelo || null,
      numeroSerie: data.numeroSerie || null,
      empresaId: data.empresaId,
      ubicacionId: data.ubicacionId || null,
      proveedorId: data.proveedorId || null,
      modalidad: data.modalidad,
      fechaAdquisicion: data.fechaAdquisicion ? new Date(data.fechaAdquisicion) : null,
      ultimaInspeccion: data.ultimaInspeccion ? new Date(data.ultimaInspeccion) : null,
      proximoVencimiento: data.proximoVencimiento ? new Date(data.proximoVencimiento) : null,
      observaciones: data.observaciones || null,
      atributos: buildAtributos(data),
      qrSlug: codigo.toLowerCase(),
    },
  });

  await logAudit(session, "CREAR", "Activo", activo.id, `${activo.codigo} · ${activo.nombre}`);
  revalidatePath("/activos");
  redirect(`/activos/${activo.id}`);
}

export async function updateActivo(
  id: string,
  _prev: ActivoFormState,
  formData: FormData
): Promise<ActivoFormState> {
  const session = await requireSession();
  const existing = await prisma.activo.findUnique({ where: { id } });
  if (!existing) return { error: "El activo no existe." };
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para editar este activo." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = activoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  const errorRelacion = await validarUbicacionYProveedor(data, existing.empresaId);
  if (errorRelacion) return { error: errorRelacion };

  await prisma.activo.update({
    where: { id },
    data: {
      tipo: data.tipo,
      nombre: data.nombre,
      marca: data.marca || null,
      modelo: data.modelo || null,
      numeroSerie: data.numeroSerie || null,
      ubicacionId: data.ubicacionId || null,
      proveedorId: data.proveedorId || null,
      modalidad: data.modalidad,
      fechaAdquisicion: data.fechaAdquisicion ? new Date(data.fechaAdquisicion) : null,
      ultimaInspeccion: data.ultimaInspeccion ? new Date(data.ultimaInspeccion) : null,
      proximoVencimiento: data.proximoVencimiento ? new Date(data.proximoVencimiento) : null,
      observaciones: data.observaciones || null,
      atributos: buildAtributos(data),
    },
  });

  await logAudit(session, "EDITAR", "Activo", id, `${existing.codigo}`);
  revalidatePath("/activos");
  revalidatePath(`/activos/${id}`);
  redirect(`/activos/${id}`);
}

export async function deleteActivo(id: string) {
  const session = await requireSession();
  const existing = await prisma.activo.findUnique({
    where: { id },
    include: { _count: { select: { mantenimientos: true } }, comodato: true },
  });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este activo.");
  }
  if (existing._count.mantenimientos > 0 || existing.comodato) {
    redirect(`/activos/${id}?error=tiene-historial`);
  }
  await prisma.activo.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Activo", id, `${existing.codigo}`);
  revalidatePath("/activos");
  redirect("/activos");
}
