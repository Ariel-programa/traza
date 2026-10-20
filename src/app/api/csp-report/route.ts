import { NextRequest, NextResponse } from "next/server";

// Recibe los reportes de violación de la Content-Security-Policy (ver
// next.config.ts) y los deja en los logs del servidor. Es público porque lo
// llama el navegador; no lee ni escribe la base y descarta cuerpos grandes.
const MAX_BYTES = 16 * 1024;

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (body.length > MAX_BYTES) return new NextResponse(null, { status: 413 });
  try {
    const parsed = JSON.parse(body);
    const report = parsed["csp-report"] ?? parsed;
    console.warn("[csp]", {
      directive: report["violated-directive"] ?? report.effectiveDirective,
      blocked: report["blocked-uri"] ?? report.blockedURL,
      page: report["document-uri"] ?? report.documentURL,
    });
  } catch {
    // Reporte malformado: se ignora.
  }
  return new NextResponse(null, { status: 204 });
}
