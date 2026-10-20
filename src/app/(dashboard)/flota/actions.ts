"use server";

import { z } from "zod";
import { enteroOpcional, fechaOpcional, numeroOpcional } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { puedeEliminar } from "@/lib/permisos";
import { logAudit } from "@/lib/audit";
import { EstadoVehiculo } from "@prisma/client";

const vehiculoSchema = z.object({
  empresaId: z.string().min(1),
  patente: z.string().min(4, "Ingresá una patente válida"),
  marca: z.string().min(1),
  modelo: z.string().min(1),
  anio: enteroOpcional(),
  tipo: z.string().min(1),
  kilometraje: numeroOpcional(),
  estado: z.nativeEnum(EstadoVehiculo),
  serviceProximo: fechaOpcional(),
  vtvVencimiento: fechaOpcional(),
  seguroVencimiento: fechaOpcional(),
});

export type VehiculoFormState = { error?: string };

export async function createVehiculo(_prev: VehiculoFormState, formData: FormData): Promise<VehiculoFormState> {
  const session = await requireSession();
  const parsed = vehiculoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para crear vehículos en esa empresa." };
  }

  const existente = await prisma.vehiculo.findUnique({ where: { patente: data.patente.toUpperCase() } });
  if (existente) return { error: "Ya existe un vehículo con esa patente." };

  const vehiculo = await prisma.vehiculo.create({
    data: {
      empresaId: data.empresaId,
      patente: data.patente.toUpperCase(),
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio ? Number(data.anio) : null,
      tipo: data.tipo,
      kilometraje: data.kilometraje ? Number(data.kilometraje) : 0,
      estado: data.estado,
      serviceProximo: data.serviceProximo ? new Date(data.serviceProximo) : null,
      vtvVencimiento: data.vtvVencimiento ? new Date(data.vtvVencimiento) : null,
      seguroVencimiento: data.seguroVencimiento ? new Date(data.seguroVencimiento) : null,
    },
  });

  await logAudit(session, "CREAR", "Vehiculo", vehiculo.id, vehiculo.patente);
  revalidatePath("/flota");
  redirect("/flota");
}

export async function updateVehiculo(id: string, _prev: VehiculoFormState, formData: FormData): Promise<VehiculoFormState> {
  const session = await requireSession();
  const existing = await prisma.vehiculo.findUnique({ where: { id } });
  if (!existing) return { error: "El vehículo no existe." };
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para editar este vehículo." };
  }
  const parsed = vehiculoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  await prisma.vehiculo.update({
    where: { id },
    data: {
      marca: data.marca,
      modelo: data.modelo,
      anio: data.anio ? Number(data.anio) : null,
      tipo: data.tipo,
      kilometraje: data.kilometraje ? Number(data.kilometraje) : 0,
      estado: data.estado,
      serviceProximo: data.serviceProximo ? new Date(data.serviceProximo) : null,
      vtvVencimiento: data.vtvVencimiento ? new Date(data.vtvVencimiento) : null,
      seguroVencimiento: data.seguroVencimiento ? new Date(data.seguroVencimiento) : null,
    },
  });

  await logAudit(session, "EDITAR", "Vehiculo", id, existing.patente);
  revalidatePath("/flota");
  redirect("/flota");
}

export async function deleteVehiculo(id: string) {
  const session = await requireSession();
  if (!puedeEliminar(session.rol)) throw new Error("No tenés permiso para eliminar registros.");
  const existing = await prisma.vehiculo.findUnique({
    where: { id },
    include: { _count: { select: { cargas: true } } },
  });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este vehículo.");
  }
  if (existing._count.cargas > 0) {
    redirect(`/flota?error=tiene-historial`);
  }
  await prisma.vehiculo.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Vehiculo", id, existing.patente);
  revalidatePath("/flota");
  redirect("/flota");
}

export type UbicacionResult = { ok: true } | { ok: false; error: string };

// Guarda la última ubicación conocida del vehículo, capturada en el momento
// desde el GPS del dispositivo que hace la llamada (celular o compu de quien
// toca "Actualizar ubicación"). No hay tracker instalado en la flota: esto
// es una foto puntual, no un seguimiento continuo -- ver /monitoreo.
export async function actualizarUbicacionVehiculo(vehiculoId: string, lat: number, lng: number): Promise<UbicacionResult> {
  const session = await requireSession();
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { ok: false, error: "Coordenadas inválidas." };
  }
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
  if (!vehiculo) return { ok: false, error: "El vehículo no existe." };
  if (session.rol !== "ADMIN" && vehiculo.empresaId !== session.empresaId) {
    return { ok: false, error: "No tenés permiso sobre este vehículo." };
  }

  await prisma.vehiculo.update({
    where: { id: vehiculoId },
    data: { ubicacionLat: lat, ubicacionLng: lng, ubicacionActualizada: new Date() },
  });

  revalidatePath(`/flota/${vehiculoId}`);
  revalidatePath("/monitoreo");
  return { ok: true };
}

// ---------- Conductores ----------

const conductorSchema = z.object({
  empresaId: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  documento: z.string().optional(),
  licencia: z.string().optional(),
  licenciaVencimiento: fechaOpcional(),
  telefono: z.string().optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type ConductorFormState = { error?: string };

export async function createConductor(_prev: ConductorFormState, formData: FormData): Promise<ConductorFormState> {
  const session = await requireSession();
  const parsed = conductorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;
  if (session.rol !== "ADMIN" && data.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para crear conductores en esa empresa." };
  }

  const conductor = await prisma.conductor.create({
    data: {
      empresaId: data.empresaId,
      nombre: data.nombre,
      apellido: data.apellido,
      documento: data.documento || null,
      licencia: data.licencia || null,
      licenciaVencimiento: data.licenciaVencimiento ? new Date(data.licenciaVencimiento) : null,
      telefono: data.telefono || null,
      estado: data.estado,
    },
  });

  await logAudit(session, "CREAR", "Conductor", conductor.id, `${conductor.nombre} ${conductor.apellido}`);
  revalidatePath("/flota/conductores");
  redirect("/flota/conductores");
}

export async function updateConductor(id: string, _prev: ConductorFormState, formData: FormData): Promise<ConductorFormState> {
  const session = await requireSession();
  const existing = await prisma.conductor.findUnique({ where: { id } });
  if (!existing) return { error: "El conductor no existe." };
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    return { error: "No tenés permiso para editar este conductor." };
  }
  const parsed = conductorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  await prisma.conductor.update({
    where: { id },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      documento: data.documento || null,
      licencia: data.licencia || null,
      licenciaVencimiento: data.licenciaVencimiento ? new Date(data.licenciaVencimiento) : null,
      telefono: data.telefono || null,
      estado: data.estado,
    },
  });

  await logAudit(session, "EDITAR", "Conductor", id, `${data.nombre} ${data.apellido}`);
  revalidatePath("/flota/conductores");
  revalidatePath(`/flota/conductores/${id}`);
  redirect(`/flota/conductores/${id}`);
}

export async function deleteConductor(id: string) {
  const session = await requireSession();
  if (!puedeEliminar(session.rol)) throw new Error("No tenés permiso para eliminar registros.");
  const existing = await prisma.conductor.findUnique({
    where: { id },
    include: { _count: { select: { traslados: true, cargas: true, documentos: true, users: true } } },
  });
  if (!existing) return;
  if (session.rol !== "ADMIN" && existing.empresaId !== session.empresaId) {
    throw new Error("No tenés permiso para eliminar este conductor.");
  }
  const { traslados, cargas, documentos, users } = existing._count;
  if (traslados > 0 || cargas > 0 || documentos > 0 || users > 0) {
    redirect(`/flota/conductores?error=tiene-historial`);
  }
  await prisma.conductor.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Conductor", id, `${existing.nombre} ${existing.apellido}`);
  revalidatePath("/flota/conductores");
  redirect("/flota/conductores");
}
