// Verifica que desactivar un usuario (Usuarios > Desactivar) revoque su
// sesion ya emitida de inmediato, en vez de esperar a que expire el JWT
// (hasta 7 dias). Crea un usuario de prueba, inicia sesion con el, lo
// desactiva desde otra sesion de admin y confirma que la sesion original
// queda bloqueada.
//
// Uso: npm run dev (en otra terminal) y despues: node scripts/verify-session-revocation.mjs
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function ok(label, condition) {
  console.log(`  ${condition ? "OK  " : "FAIL"}  ${label}`);
  if (!condition) process.exitCode = 1;
}

async function main() {
  const empresa = await prisma.empresa.findFirst();
  if (!empresa) throw new Error("No hay datos demo suficientes. Corre `npm run db:seed` primero.");

  const email = `verify-revocacion-${Date.now()}@traza.local`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("demo1234", 10),
      nombre: "Test",
      apellido: "Revocacion",
      rol: "EMPRESA",
      empresaId: empresa.id,
      activo: true,
    },
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", email);
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);
    ok("usuario de prueba puede iniciar sesion", page.url() === `${BASE_URL}/dashboard`);

    await prisma.user.update({ where: { id: user.id }, data: { activo: false } });

    await page.goto(`${BASE_URL}/dashboard`);
    ok("sesion queda bloqueada apenas se desactiva el usuario (redirige a login)", page.url().startsWith(`${BASE_URL}/login`));

    if (process.exitCode === 1) {
      console.log("\nVERIFY SESSION REVOCATION: FALLO");
    } else {
      console.log("\nVERIFY SESSION REVOCATION: TODO OK");
    }
  } finally {
    await browser.close();
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await prisma.user.deleteMany({ where: { email: { startsWith: "verify-revocacion-" } } }).catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
