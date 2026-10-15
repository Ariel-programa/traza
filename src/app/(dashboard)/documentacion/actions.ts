"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { EntidadDocumento } from "@prisma/client";
import { calcularEstadoVencimiento } from "@/lib/vencimientos";

const schema = z.object({
  entidadTipo: z.nativeEnum(EntidadDocumento),
  entidadId: z.string().min(1, "Seleccioná a qué aplica el documento"),
  tipo: z.string().min(2, "Indicá el tipo de documento"),
  numero: z.string().optional(),
  fechaEmision: z.string().optional(),
  vencimiento: z.string().optional(),
  archivoUrl: z.string().optional(),
});

export type DocumentoFormState = { error?: string };

const ESTADO_MAP = { VIGENTE: "VIGENTE", PROXIMO: "PROXIMO_A_VENCER", VENCIDO: "VENCIDO", SIN_FECHA: "VIGENTE" } as const;

export async function assertEntidadPermitida(entidadTipo: EntidadDocumento, entidadId: string, empresaId: string | null, isAdmin: boolean) {
  if (isAdmin) return true;
  switch (entidadTipo) {
    case "ACTIVO": {
      const a = await prisma.activo.findUnique({ where: { id: entidadId } });
      return a?.empresaId === empresaId;
    }
    case "VEHICULO": {
      const v = await prisma.vehiculo.findUnique({ where: { id: entidadId } });
      return v?.empresaId === empresaId;
    }
    case "CONDUCTOR": {
      const c = await prisma.conductor.findUnique({ where: { id: entidadId } });
      return c?.empresaId === empresaId;
    }
    case "PROVEEDOR": {
      const p = await prisma.proveedor.findUnique({ where: { id: entidadId } });
      return p?.empresaId === empresaId;
    }
    case "EMPRESA":
      return entidadId === empresaId;
    default:
      return false;
  }
}

export async function createDocumento(_prev: DocumentoFormState, formData: FormData): Promise<DocumentoFormState> {
  const session = await requireSession();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const permitido = await assertEntidadPermitida(data.entidadTipo, data.entidadId, session.empresaId, session.rol === "ADMIN");
  if (!permitido) return { error: "No tenés permiso para cargar documentación sobre ese registro." };

  const vencimiento = data.vencimiento ? new Date(data.vencimiento) : null;
  const estado = ESTADO_MAP[calcularEstadoVencimiento(vencimiento)];

  const fk: Record<string, string> = {};
  if (data.entidadTipo === "ACTIVO") fk.activoId = data.entidadId;
  if (data.entidadTipo === "VEHICULO") fk.vehiculoId = data.entidadId;
  if (data.entidadTipo === "CONDUCTOR") fk.conductorId = data.entidadId;
  if (data.entidadTipo === "PROVEEDOR") fk.proveedorId = data.entidadId;

  const documento = await prisma.documento.create({
    data: {
      entidadTipo: data.entidadTipo,
      entidadId: data.entidadId,
      tipo: data.tipo,
      numero: data.numero || null,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : null,
      vencimiento,
      archivoUrl: data.archivoUrl || null,
      estado,
      ...fk,
    },
  });

  await logAudit(session, "CREAR", "Documento", documento.id, data.tipo);
  revalidatePath("/documentacion");
  redirect("/documentacion");
}

export async function updateDocumento(id: string, _prev: DocumentoFormState, formData: FormData): Promise<DocumentoFormState> {
  const session = await requireSession();
  const existing = await prisma.documento.findUnique({ where: { id } });
  if (!existing) return { error: "El documento no existe." };
  const permitidoExistente = await assertEntidadPermitida(existing.entidadTipo, existing.entidadId, session.empresaId, session.rol === "ADMIN");
  if (!permitidoExistente) return { error: "No tenés permiso para editar este documento." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const data = parsed.data;

  const permitidoNuevo = await assertEntidadPermitida(data.entidadTipo, data.entidadId, session.empresaId, session.rol === "ADMIN");
  if (!permitidoNuevo) return { error: "No tenés permiso para cargar documentación sobre ese registro." };

  const vencimiento = data.vencimiento ? new Date(data.vencimiento) : null;
  const estado = ESTADO_MAP[calcularEstadoVencimiento(vencimiento)];

  const fk = { activoId: null, vehiculoId: null, conductorId: null, proveedorId: null } as Record<string, string | null>;
  if (data.entidadTipo === "ACTIVO") fk.activoId = data.entidadId;
  if (data.entidadTipo === "VEHICULO") fk.vehiculoId = data.entidadId;
  if (data.entidadTipo === "CONDUCTOR") fk.conductorId = data.entidadId;
  if (data.entidadTipo === "PROVEEDOR") fk.proveedorId = data.entidadId;

  await prisma.documento.update({
    where: { id },
    data: {
      entidadTipo: data.entidadTipo,
      entidadId: data.entidadId,
      tipo: data.tipo,
      numero: data.numero || null,
      fechaEmision: data.fechaEmision ? new Date(data.fechaEmision) : null,
      vencimiento,
      archivoUrl: data.archivoUrl || null,
      estado,
      ...fk,
    },
  });

  await logAudit(session, "EDITAR", "Documento", id, data.tipo);
  revalidatePath("/documentacion");
  redirect("/documentacion");
}

export async function deleteDocumento(id: string) {
  const session = await requireSession();
  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) return;
  const permitido = await assertEntidadPermitida(documento.entidadTipo, documento.entidadId, session.empresaId, session.rol === "ADMIN");
  if (!permitido) throw new Error("No tenés permiso para eliminar este documento.");
  await prisma.documento.delete({ where: { id } });
  await logAudit(session, "ELIMINAR", "Documento", id, documento.tipo);
  revalidatePath("/documentacion");
  redirect("/documentacion");
}
