import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularEstadoVencimiento, calcularEstadoImpuesto } from "@/lib/vencimientos";
import { triggerWebhooks } from "@/lib/webhooks";
import { EstadoActivo, EstadoDocumento } from "@prisma/client";

const ESTADO_ACTIVO_MAP = {
  VIGENTE: EstadoActivo.VIGENTE,
  PROXIMO: EstadoActivo.PROXIMO_A_VENCER,
  VENCIDO: EstadoActivo.VENCIDO,
  SIN_FECHA: EstadoActivo.VIGENTE,
} as const;

const ESTADO_DOC_MAP = {
  VIGENTE: EstadoDocumento.VIGENTE,
  PROXIMO: EstadoDocumento.PROXIMO_A_VENCER,
  VENCIDO: EstadoDocumento.VENCIDO,
  SIN_FECHA: EstadoDocumento.VIGENTE,
} as const;

// Endpoint pensado para ser llamado periódicamente (por ejemplo, una vez por
// día) desde un Schedule Trigger de n8n o un cron externo. Recalcula el
// estado de vencimiento de activos y documentos, y dispara los webhooks
// configurados para los que están vencidos o próximos a vencer.
//
// Protegido con CRON_SECRET (ver .env.example). Sin ese secreto configurado,
// el endpoint queda deshabilitado por seguridad.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 501 });
  }
  const provided = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-cron-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const activos = await prisma.activo.findMany({ where: { proximoVencimiento: { not: null } } });
  let actualizados = 0;
  let notificadosActivos = 0;

  for (const activo of activos) {
    const clave = calcularEstadoVencimiento(activo.proximoVencimiento);
    const nuevoEstado = ESTADO_ACTIVO_MAP[clave];
    if (nuevoEstado !== activo.estado) {
      await prisma.activo.update({ where: { id: activo.id }, data: { estado: nuevoEstado } });
      actualizados++;
    }
    if (nuevoEstado === EstadoActivo.VENCIDO || nuevoEstado === EstadoActivo.PROXIMO_A_VENCER) {
      await triggerWebhooks(
        nuevoEstado === EstadoActivo.VENCIDO ? "ACTIVO_VENCIDO" : "ACTIVO_PROXIMO_A_VENCER",
        activo.empresaId,
        { codigo: activo.codigo, nombre: activo.nombre, proximoVencimiento: activo.proximoVencimiento }
      );
      notificadosActivos++;
    }
  }

  const documentos = await prisma.documento.findMany({ where: { vencimiento: { not: null } } });
  let notificadosDocs = 0;

  for (const doc of documentos) {
    const clave = calcularEstadoVencimiento(doc.vencimiento);
    const nuevoEstado = ESTADO_DOC_MAP[clave];
    if (nuevoEstado !== doc.estado) {
      await prisma.documento.update({ where: { id: doc.id }, data: { estado: nuevoEstado } });
    }
    if (nuevoEstado === EstadoDocumento.PROXIMO_A_VENCER || nuevoEstado === EstadoDocumento.VENCIDO) {
      const empresaId =
        (doc.activoId && (await prisma.activo.findUnique({ where: { id: doc.activoId } }))?.empresaId) ||
        (doc.vehiculoId && (await prisma.vehiculo.findUnique({ where: { id: doc.vehiculoId } }))?.empresaId) ||
        null;
      await triggerWebhooks("DOCUMENTACION_PROXIMA_A_VENCER", empresaId ?? null, {
        tipo: doc.tipo,
        numero: doc.numero,
        vencimiento: doc.vencimiento,
      });
      notificadosDocs++;
    }
  }

  const impuestos = await prisma.impuesto.findMany({ where: { estado: { not: "PAGADO" } } });
  let notificadosImpuestos = 0;

  for (const imp of impuestos) {
    const nuevoEstado = calcularEstadoImpuesto(imp.vencimiento, imp.fechaPago);
    if (nuevoEstado !== imp.estado) {
      await prisma.impuesto.update({ where: { id: imp.id }, data: { estado: nuevoEstado } });
    }
    if (nuevoEstado === "VENCIDO" || calcularEstadoVencimiento(imp.vencimiento) === "PROXIMO") {
      await triggerWebhooks(
        nuevoEstado === "VENCIDO" ? "IMPUESTO_VENCIDO" : "IMPUESTO_PROXIMO_A_VENCER",
        imp.empresaId,
        { nombre: imp.nombre, importe: imp.importe, vencimiento: imp.vencimiento }
      );
      notificadosImpuestos++;
    }
  }

  // Mantenimientos programados (Mantenimiento.proximaFecha) — misma fuente que
  // alimenta la categoría "Mantenimiento" del Centro de Vencimientos.
  const mantenimientos = await prisma.mantenimiento.findMany({
    where: { proximaFecha: { not: null } },
    include: { activo: true },
  });
  let notificadosMantenimientos = 0;

  for (const m of mantenimientos) {
    const clave = calcularEstadoVencimiento(m.proximaFecha);
    if (clave === "PROXIMO" || clave === "VENCIDO") {
      await triggerWebhooks("MANTENIMIENTO_PROXIMO", m.activo.empresaId, {
        codigo: m.activo.codigo,
        nombre: m.activo.nombre,
        tipo: m.tipo,
        proximaFecha: m.proximaFecha,
      });
      notificadosMantenimientos++;
    }
  }

  // Flota: VTV, seguro y service de Vehiculo — igual que el resto, son campos
  // de fecha directos (no un Documento), así que se recorren aparte.
  const vehiculos = await prisma.vehiculo.findMany({
    where: { OR: [{ vtvVencimiento: { not: null } }, { seguroVencimiento: { not: null } }, { serviceProximo: { not: null } }] },
  });
  let notificadosVehiculos = 0;

  for (const v of vehiculos) {
    const campos: [Date | null, string, string][] = [
      [v.vtvVencimiento, "VTV", "VEHICULO_DOCUMENTACION_PROXIMA_A_VENCER"],
      [v.seguroVencimiento, "Seguro", "VEHICULO_DOCUMENTACION_PROXIMA_A_VENCER"],
      [v.serviceProximo, "Service", "MANTENIMIENTO_PROXIMO"],
    ];
    for (const [fecha, label, evento] of campos) {
      if (!fecha) continue;
      const clave = calcularEstadoVencimiento(fecha);
      if (clave === "PROXIMO" || clave === "VENCIDO") {
        await triggerWebhooks(evento, v.empresaId, {
          patente: v.patente,
          marca: v.marca,
          modelo: v.modelo,
          concepto: label,
          vencimiento: fecha,
        });
        notificadosVehiculos++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    activosRevisados: activos.length,
    activosActualizados: actualizados,
    activosNotificados: notificadosActivos,
    documentosRevisados: documentos.length,
    documentosNotificados: notificadosDocs,
    impuestosRevisados: impuestos.length,
    impuestosNotificados: notificadosImpuestos,
    mantenimientosRevisados: mantenimientos.length,
    mantenimientosNotificados: notificadosMantenimientos,
    vehiculosRevisados: vehiculos.length,
    vehiculosNotificados: notificadosVehiculos,
  });
}
