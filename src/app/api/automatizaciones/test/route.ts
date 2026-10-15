import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerN8nWorkflow } from "@/lib/n8n";

// Dispara el workflow de prueba `traza_test` en n8n para verificar que la
// integración está bien configurada. Pensado para el botón "Probar conexión
// con n8n" en Configuración → Automatizaciones.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED", message: "Necesitás iniciar sesión." },
      { status: 401 }
    );
  }
  if (session.rol !== "ADMIN" && session.rol !== "EMPRESA") {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: "No tenés permiso para probar automatizaciones." },
      { status: 403 }
    );
  }

  const empresa = session.empresaId
    ? await prisma.empresa.findUnique({ where: { id: session.empresaId }, select: { nombre: true } })
    : null;

  const result = await triggerN8nWorkflow("traza_test", {
    empresaId: session.empresaId,
    empresaNombre: empresa?.nombre ?? null,
    usuario: session.nombre,
    rol: session.rol,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true, message: "Conexión con n8n exitosa." });
  }

  switch (result.error) {
    case "NOT_CONFIGURED":
      return NextResponse.json(
        { ok: false, error: result.error, message: "N8N_BASE_URL no está configurado en el servidor." },
        { status: 501 }
      );
    case "TIMEOUT":
      return NextResponse.json(
        { ok: false, error: result.error, message: "n8n no respondió a tiempo (timeout)." },
        { status: 504 }
      );
    case "HTTP_ERROR":
      if (result.status === 401 || result.status === 403) {
        return NextResponse.json(
          { ok: false, error: "AUTH_ERROR", message: "n8n rechazó la autenticación. Revisá N8N_WEBHOOK_SECRET." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { ok: false, error: result.error, message: `El workflow de n8n respondió con error (HTTP ${result.status}).` },
        { status: 502 }
      );
    case "NETWORK_ERROR":
    default:
      return NextResponse.json(
        {
          ok: false,
          error: "NETWORK_ERROR",
          message: "No se pudo conectar con n8n. Verificá N8N_BASE_URL y que el contenedor esté corriendo.",
        },
        { status: 502 }
      );
  }
}
