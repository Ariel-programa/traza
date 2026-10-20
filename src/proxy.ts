import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretKey } from "@/lib/env";

// Default cerrado: todo exige sesión salvo esta lista explícita. Cada entrada
// pública debe justificar por qué no expone datos privados.
const PUBLIC_PATHS = [
  "/login",
  "/public", // ficha del QR: solo estado del activo, slug no adivinable (src/lib/qr-slug.ts)
  "/api/qr", // imagen PNG del QR, no consulta la base
  "/api/cron", // protegido por CRON_SECRET dentro del handler
  "/api/csp-report", // reportes CSP del navegador: solo loguea, no toca la base
  "/icon",
  "/apple-icon",
  "/favicon.ico",
  // Metadata pública de la landing (SEO / previews al compartir)
  "/robots.txt",
  "/opengraph-image",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Forzar HTTPS en self-hosting detrás de un proxy/balanceador que termina
  // TLS y envía x-forwarded-proto (Vercel ya redirige solo). Es opt-in con
  // FORCE_HTTPS=true porque `next start` sin proxy marca todo como "http".
  if (process.env.FORCE_HTTPS === "true" && req.headers.get("x-forwarded-proto") === "http") {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = "https:";
    httpsUrl.port = "";
    return NextResponse.redirect(httpsUrl, 308);
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("traza_session")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, getJwtSecretKey(), { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("traza_session");
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
