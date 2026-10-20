import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy. Orígenes externos que usa la app:
//   - cdn.jsdelivr.net: worker, core wasm y datos de idioma de tesseract.js (OCR de tickets)
//   - *.tile.openstreetmap.org: tiles del mapa de flota (Leaflet)
//   - unpkg.com: íconos de marcador de Leaflet
// Se despliega en Report-Only: el navegador reporta violaciones a
// /api/csp-report sin bloquear nada. Cuando los logs queden en cero, poner
// CSP_ENFORCE=true para pasarla a modo bloqueante.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join("; ");

const cspHeader = process.env.CSP_ENFORCE === "true" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const securityHeaders = [
  { key: cspHeader, value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Cámara (foto de tickets) y geolocalización (ubicación de vehículos) solo
  // para la propia app; el resto de las APIs sensibles, deshabilitadas.
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS solo en producción (en localhost http rompería el desarrollo).
  // `preload` permite inscribir el dominio en hstspreload.org: hacerlo solo
  // cuando TODOS los subdominios sirvan HTTPS.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
