// Verifica que el limite de activos del plan se aplique de verdad al crear
// un activo (no solo se muestre como barra de progreso en /planes).
// Crea una empresa de prueba en plan FREE (limite bajo), la llena hasta el
// limite y confirma que el siguiente alta se bloquea con un mensaje de error.
//
// Uso: npm run dev (en otra terminal) y despues: node scripts/verify-plan-limits.mjs
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
  const planFree = await prisma.plan.findUnique({ where: { nombre: "FREE" } });
  if (!planFree) throw new Error("No hay datos demo suficientes. Corre `npm run db:seed` primero.");

  const stamp = Date.now();
  const empresa = await prisma.empresa.create({ data: { nombre: `Empresa Limite Test ${stamp}` } });
  await prisma.suscripcion.create({
    data: { empresaId: empresa.id, planId: planFree.id, estado: "DEMO", fechaRenovacion: new Date(Date.now() + 30 * 86400000) },
  });
  const email = `verify-limite-${stamp}@traza.local`;
  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash("demo1234", 10),
      nombre: "Test",
      apellido: "Limite",
      rol: "EMPRESA",
      empresaId: empresa.id,
      activo: true,
    },
  });

  for (let i = 0; i < planFree.limiteActivos; i++) {
    await prisma.activo.create({
      data: {
        codigo: `LIM-${stamp}-${i}`,
        tipo: "OTRO",
        nombre: `Activo límite ${i}`,
        empresaId: empresa.id,
        qrSlug: `lim-${stamp}-${i}`,
      },
    });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", email);
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);

    await page.goto(`${BASE_URL}/activos/nuevo`);
    await page.fill("#nombre", "Activo que no debería entrar");
    await page.click('main button[type="submit"]');
    await page.waitForSelector('main [role="alert"]');
    const mensaje = await page.locator('main [role="alert"]').first().textContent();
    ok("crear activo al superar el límite del plan queda bloqueado con mensaje", /límite/i.test(mensaje ?? ""));

    const countTrasIntento = await prisma.activo.count({ where: { empresaId: empresa.id } });
    ok("no se creó ningún activo de más", countTrasIntento === planFree.limiteActivos);

    if (process.exitCode === 1) {
      console.log("\nVERIFY PLAN LIMITS: FALLO");
    } else {
      console.log("\nVERIFY PLAN LIMITS: TODO OK");
    }
  } finally {
    await browser.close();
    await prisma.activo.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.user.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.suscripcion.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.empresa.delete({ where: { id: empresa.id } });
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
