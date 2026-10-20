import { isIP } from "node:net";

// Los webhooks los configura cada empresa (cliente) y los dispara el
// servidor: sin control, alguien podría apuntarlos a servicios internos o a
// la metadata del proveedor cloud (SSRF). Reglas:
//   - solo http/https, sin credenciales embebidas;
//   - nunca link-local (169.254.0.0/16, fe80::/10: metadata cloud);
//   - en producción, nada de loopback / redes privadas / hosts sin dominio,
//     salvo los hosts listados en WEBHOOK_ALLOWED_HOSTS (ej. "n8n,n8n.interno")
//     para el caso legítimo de un n8n en la misma red.

function allowedHosts() {
  return new Set(
    (process.env.WEBHOOK_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}

function ipv4EnRango(ip: string, rangos: [string, number][]) {
  const n = ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
  return rangos.some(([base, bits]) => {
    const b = base.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (n & mask) === (b & mask);
  });
}

// IPv4 embebida en IPv6 ("::ffff:127.0.0.1", que new URL normaliza a
// "::ffff:7f00:1"): sin esto, se saltearía el bloqueo de redes privadas.
function ipv4Mapeada(host: string): string | null {
  const m = /^::ffff:(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/.exec(host);
  if (!m) return null;
  if (m[1]) return m[1];
  const hi = parseInt(m[2], 16);
  const lo = parseInt(m[3], 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
}

const LINK_LOCAL_V4: [string, number][] = [["169.254.0.0", 16]];
const PRIVADAS_V4: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
];

export function validarUrlWebhook(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Ingresá una URL válida.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "La URL debe empezar con https://";
  if (url.username || url.password) return "La URL no puede incluir usuario o contraseña.";

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (allowedHosts().has(host)) return null;

  const version = isIP(host);
  const v4 = version === 4 ? host : version === 6 ? ipv4Mapeada(host) : null;

  if (v4 && ipv4EnRango(v4, LINK_LOCAL_V4)) return "Esa dirección no está permitida.";
  if (version === 6 && /^fe[89ab]/.test(host)) return "Esa dirección no está permitida.";

  if (process.env.NODE_ENV === "production") {
    if (url.protocol !== "https:") return "En producción la URL del webhook debe usar https://";
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
      return "No se permiten direcciones internas.";
    }
    if (!version && !host.includes(".")) return "No se permiten direcciones internas.";
    if (v4 && ipv4EnRango(v4, PRIVADAS_V4)) return "No se permiten direcciones internas.";
    if (version === 6 && (host === "::1" || host === "::" || /^f[cd]/.test(host))) return "No se permiten direcciones internas.";
  }
  return null;
}
