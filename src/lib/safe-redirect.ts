// Solo rutas internas: "//evil.com" o "/\evil.com" empiezan con "/" pero el
// navegador los interpreta como otro dominio (open redirect tras el login).
export function destinoSeguro(next: string, fallback = "/dashboard") {
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
