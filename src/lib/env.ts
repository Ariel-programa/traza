// Lectura centralizada de secretos críticos. En producción, si falta un
// secreto (o quedó el valor de ejemplo), la app falla fuerte en vez de
// arrancar con un default inseguro que permitiría falsificar sesiones.

const PLACEHOLDERS = new Set([
  "cambiar-por-un-secreto-largo-y-aleatorio",
  "traza-dev-secret-change-in-production",
]);

const DEV_JWT_SECRET = "traza-dev-secret-change-in-production";
const MIN_SECRET_LENGTH = 32;

const isProduction = process.env.NODE_ENV === "production";

export function requireSecret(name: string, { minLength = MIN_SECRET_LENGTH } = {}): string {
  const value = process.env[name];
  if (!value || PLACEHOLDERS.has(value) || value.length < minLength) {
    throw new Error(
      `[env] ${name} falta, es el valor de ejemplo o tiene menos de ${minLength} caracteres. ` +
        `Generá uno con: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
    );
  }
  return value;
}

let jwtKey: Uint8Array | null = null;

export function getJwtSecretKey(): Uint8Array {
  if (!jwtKey) {
    const secret = isProduction ? requireSecret("JWT_SECRET") : process.env.JWT_SECRET || DEV_JWT_SECRET;
    jwtKey = new TextEncoder().encode(secret);
  }
  return jwtKey;
}
