// Se ejecuta una vez al arrancar el servidor. En producción valida los
// secretos críticos para que un despliegue mal configurado falle al iniciar
// (visible en los logs) en lugar de quedar corriendo con sesiones rotas.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { getJwtSecretKey } = await import("@/lib/env");
  getJwtSecretKey();
  if (!process.env.DATABASE_URL) throw new Error("[env] DATABASE_URL no está configurada.");
}
