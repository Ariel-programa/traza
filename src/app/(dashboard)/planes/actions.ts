"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { EstadoSuscripcion, EstadoPago } from "@prisma/client";

// Checkout DEMO: simula la contratación de un plan sin procesar pagos reales.
// Deja la arquitectura lista para integrar Mercado Pago o Stripe en el futuro
// (ver README > Pagos).
export async function contratarPlanDemo(planId: string) {
  const session = await requireSession();
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") {
    throw new Error("No tenés permiso para gestionar la suscripción.");
  }
  if (!session.empresaId) throw new Error("Tu usuario no está asociado a una empresa.");

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("El plan no existe.");

  const suscripcion = await prisma.suscripcion.upsert({
    where: { empresaId: session.empresaId },
    update: {
      planId: plan.id,
      estado: EstadoSuscripcion.ACTIVA,
      fechaRenovacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      empresaId: session.empresaId,
      planId: plan.id,
      estado: EstadoSuscripcion.ACTIVA,
      fechaRenovacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  if (plan.precioMensual > 0) {
    await prisma.pago.create({
      data: {
        suscripcionId: suscripcion.id,
        monto: plan.precioMensual,
        metodo: "demo",
        estado: EstadoPago.APROBADO,
      },
    });
  }

  await logAudit(session, "CONTRATAR_PLAN", "Suscripcion", suscripcion.id, plan.nombre);
  revalidatePath("/planes");
  redirect("/planes");
}
