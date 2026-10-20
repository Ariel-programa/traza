// Tests de las reglas de seguridad que no necesitan servidor ni base:
// política de contraseñas, validación de inputs y uploads, SSRF en webhooks,
// open redirect del login y falla fuerte ante secretos faltantes.
//
// Uso: npm run test:security
import { passwordSchema, passwordContieneEmail } from "../src/lib/password-policy";
import { fecha, numero, urlOpcional, fotoOpcional } from "../src/lib/validation";
import { validarUrlWebhook } from "../src/lib/webhook-url";
import { destinoSeguro } from "../src/lib/safe-redirect";
import { requireSecret } from "../src/lib/env";
import { generarQrSlug } from "../src/lib/qr-slug";
import { puedeEliminar } from "../src/lib/permisos";

function ok(label: string, condition: boolean) {
  console.log(`  ${condition ? "OK  " : "FAIL"}  ${label}`);
  if (!condition) process.exitCode = 1;
}

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else (process.env as Record<string, string>)[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else (process.env as Record<string, string>)[k] = v;
    }
  }
}

console.log("Contraseñas");
ok("rechaza 12345678", !passwordSchema.safeParse("12345678").success);
ok("rechaza 1234567890 (común aunque cumple largo)", !passwordSchema.safeParse("1234567890").success);
ok("rechaza password123", !passwordSchema.safeParse("password123").success);
ok("rechaza aaaaaaaaaaaa", !passwordSchema.safeParse("aaaaaaaaaaaa").success);
ok("rechaza menos de 10 caracteres", !passwordSchema.safeParse("Xk9#pQ2z").success);
ok("acepta una frase larga", passwordSchema.safeParse("camion-verde-ruta-40").success);
ok("detecta usuario del email en la contraseña", passwordContieneEmail("mlopez2024!!", "mlopez@empresa.com"));

console.log("Validación de inputs");
ok("fecha inválida rechazada", !fecha().safeParse("no-es-fecha").success);
ok("fecha ISO aceptada", fecha().safeParse("2026-10-20").success);
ok("importe no numérico rechazado", !numero().safeParse("abc").success);
ok("importe negativo rechazado", !numero().safeParse("-5").success);
ok("importe válido aceptado", numero().safeParse("1500.50").success);
ok("enlace javascript: rechazado", !urlOpcional().safeParse("javascript:alert(1)").success);
ok("enlace https aceptado", urlOpcional().safeParse("https://drive.example.com/x.pdf").success);

console.log("Uploads (foto de ticket)");
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]).toString("base64");
const exe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(64)]).toString("base64");
ok("JPEG real aceptado", fotoOpcional().safeParse(`data:image/jpeg;base64,${jpeg}`).success);
ok("ejecutable disfrazado de JPEG rechazado", !fotoOpcional().safeParse(`data:image/jpeg;base64,${exe}`).success);
ok("SVG rechazado", !fotoOpcional().safeParse("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=").success);
ok("imagen gigante rechazada", !fotoOpcional().safeParse(`data:image/jpeg;base64,/9j/${"A".repeat(1_000_000)}`).success);
ok("texto arbitrario rechazado", !fotoOpcional().safeParse("https://evil.com/x.jpg").success);

console.log("Webhooks (SSRF)");
ok("metadata cloud bloqueada siempre", validarUrlWebhook("http://169.254.169.254/latest/meta-data") !== null);
ok("metadata cloud vía IPv6 mapeada bloqueada", validarUrlWebhook("http://[::ffff:169.254.169.254]/") !== null);
ok("esquema file: bloqueado", validarUrlWebhook("file:///etc/passwd") !== null);
ok("credenciales en URL bloqueadas", validarUrlWebhook("https://user:pass@hooks.example.com") !== null);
withEnv({ NODE_ENV: "production", WEBHOOK_ALLOWED_HOSTS: "n8n" }, () => {
  ok("prod: localhost bloqueado", validarUrlWebhook("https://localhost:5678/webhook/x") !== null);
  ok("prod: red privada bloqueada", validarUrlWebhook("https://10.0.0.5/webhook/x") !== null);
  ok("prod: IPv4 mapeada en IPv6 bloqueada", validarUrlWebhook("https://[::ffff:127.0.0.1]/x") !== null);
  ok("prod: http plano bloqueado", validarUrlWebhook("http://hooks.example.com/x") !== null);
  ok("prod: host en WEBHOOK_ALLOWED_HOSTS permitido", validarUrlWebhook("http://n8n:5678/webhook/x") === null);
  ok("prod: https público permitido", validarUrlWebhook("https://hooks.example.com/x") === null);
});

console.log("Redirect tras login");
ok("//evil.com → /dashboard", destinoSeguro("//evil.com") === "/dashboard");
ok("/\\evil.com → /dashboard", destinoSeguro("/\\evil.com") === "/dashboard");
ok("https://evil.com → /dashboard", destinoSeguro("https://evil.com") === "/dashboard");
ok("/activos se respeta", destinoSeguro("/activos") === "/activos");

console.log("Secretos");
withEnv({ JWT_SECRET: undefined }, () => {
  let lanzo = false;
  try { requireSecret("JWT_SECRET"); } catch { lanzo = true; }
  ok("falla fuerte si falta JWT_SECRET", lanzo);
});
withEnv({ JWT_SECRET: "cambiar-por-un-secreto-largo-y-aleatorio" }, () => {
  let lanzo = false;
  try { requireSecret("JWT_SECRET"); } catch { lanzo = true; }
  ok("falla fuerte con el valor de ejemplo", lanzo);
});

console.log("QR público");
const slug = generarQrSlug("MF-00001");
ok("slug no adivinable (sufijo aleatorio de 16 hex)", /^mf-00001-[0-9a-f]{16}$/.test(slug) && slug !== generarQrSlug("MF-00001"));

console.log("Permisos para eliminar");
ok("ADMIN y EMPRESA pueden eliminar", puedeEliminar("ADMIN") && puedeEliminar("EMPRESA"));
ok("TECNICO, CONDUCTOR y PROVEEDOR no pueden eliminar", !puedeEliminar("TECNICO") && !puedeEliminar("CONDUCTOR") && !puedeEliminar("PROVEEDOR"));

console.log(process.exitCode ? "\nHay fallas." : "\nTodo OK.");
