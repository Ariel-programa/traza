// Verifica que un usuario de la Empresa A no pueda, manipulando el <select>
// de un formulario (igual que haria alguien editando el DOM/devtools antes
// de enviar), enganchar un registro nuevo al vehiculo/traslado de la
// Empresa B. Los <select> del formulario solo listan las opciones de la
// propia empresa, asi que este test inyecta una <option> extra con el id
// ajeno para simular el POST que un atacante armaria a mano, y confirma que
// el Server Action lo rechaza (no alcanza con que la UI no lo ofrezca: el
// servidor tiene que revalidarlo).
//
// Uso: npm run dev (en otra terminal) y despues: node scripts/verify-tenant-isolation.mjs
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function ok(label, condition) {
  console.log(`  ${condition ? "OK  " : "FAIL"}  ${label}`);
  if (!condition) process.exitCode = 1;
}

async function injectAndSelect(page, selectId, value, label) {
  await page.evaluate(
    ({ selectId, value, label }) => {
      const select = document.querySelector(`#${selectId}`);
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
      select.value = value;
    },
    { selectId, value, label }
  );
}

async function main() {
  const [empresaA, empresaB] = await prisma.empresa.findMany({ take: 2, orderBy: { createdAt: "asc" } });
  if (!empresaA || !empresaB) throw new Error("Se necesitan al menos 2 empresas. Corre `npm run db:seed` primero.");

  const stamp = Date.now();
  const emailA = `verify-tenant-a-${stamp}@traza.local`;
  const userA = await prisma.user.create({
    data: {
      email: emailA,
      passwordHash: await bcrypt.hash("demo1234", 10),
      nombre: "Tenant",
      apellido: "A",
      rol: "EMPRESA",
      empresaId: empresaA.id,
      activo: true,
    },
  });

  const vehiculoB = await prisma.vehiculo.create({
    data: { empresaId: empresaB.id, patente: `TEN${stamp % 10000}`, marca: "Test", modelo: "Test", tipo: "Auto", estado: "DISPONIBLE" },
  });
  const trasladoB = await prisma.traslado.create({
    data: { numero: `TEN-${stamp}`, empresaId: empresaB.id, origen: "X", destino: "Y", estado: "PLANIFICADO" },
  });
  const ubicacionB = await prisma.ubicacion.create({
    data: { empresaId: empresaB.id, nombre: `Ubicación ajena ${stamp}`, tipo: "DEPOSITO" },
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", emailA);
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);

    // 1) Traslado: intentar "adoptar" el vehiculo de la empresa B y ponerlo EN_CURSO.
    await page.goto(`${BASE_URL}/logistica/nuevo`);
    await page.fill("#origen", "Depósito propio");
    await page.fill("#destino", "Cliente propio");
    await injectAndSelect(page, "vehiculoId", vehiculoB.id, "Vehículo ajeno (inyectado)");
    await page.selectOption("#estado", "EN_CURSO");
    await page.click('main button[type="submit"]');
    await page.waitForSelector('main [role="alert"]');
    const msgTraslado = await page.locator('main [role="alert"]').first().textContent();
    ok("crear traslado con vehículo de otra empresa queda bloqueado", /no pertenece a esta empresa/i.test(msgTraslado ?? ""));

    const vehiculoBTrasIntento = await prisma.vehiculo.findUnique({ where: { id: vehiculoB.id } });
    ok("el vehículo de la empresa B no quedó marcado EN_VIAJE", vehiculoBTrasIntento.estado === "DISPONIBLE");

    const trasladoInyectado = await prisma.traslado.findFirst({ where: { vehiculoId: vehiculoB.id, empresaId: empresaA.id } });
    ok("no se creó ningún traslado de la empresa A enganchado al vehículo de la empresa B", !trasladoInyectado);

    // 2) Gasto: intentar enganchar el gasto al traslado de la empresa B.
    await page.goto(`${BASE_URL}/gastos/nuevo`);
    await page.fill("#importe", "1000");
    await injectAndSelect(page, "trasladoId", trasladoB.id, "Traslado ajeno (inyectado)");
    await page.click('main button[type="submit"]');
    await page.waitForSelector('main [role="alert"]');
    const msgGasto = await page.locator('main [role="alert"]').first().textContent();
    ok("crear gasto enganchado al traslado de otra empresa queda bloqueado", /no pertenece a esta empresa/i.test(msgGasto ?? ""));

    const gastoInyectado = await prisma.gasto.findFirst({ where: { trasladoId: trasladoB.id } });
    ok("no se creó ningún gasto enganchado al traslado de la empresa B", !gastoInyectado);

    // 3) Activo: intentar crearlo enganchado a la ubicación de la empresa B.
    await page.goto(`${BASE_URL}/activos/nuevo`);
    await page.fill("#nombre", "Activo con ubicación ajena");
    await injectAndSelect(page, "ubicacionId", ubicacionB.id, "Ubicación ajena (inyectada)");
    await page.click('main button[type="submit"]');
    await page.waitForSelector('main [role="alert"]');
    const msgActivo = await page.locator('main [role="alert"]').first().textContent();
    ok("crear activo con ubicación de otra empresa queda bloqueado", /no pertenece a esta empresa/i.test(msgActivo ?? ""));

    const activoInyectado = await prisma.activo.findFirst({ where: { ubicacionId: ubicacionB.id } });
    ok("no se creó ningún activo enganchado a la ubicación de la empresa B", !activoInyectado);

    if (process.exitCode === 1) {
      console.log("\nVERIFY TENANT ISOLATION: FALLO");
    } else {
      console.log("\nVERIFY TENANT ISOLATION: TODO OK");
    }
  } finally {
    await browser.close();
    await prisma.traslado.delete({ where: { id: trasladoB.id } }).catch(() => {});
    await prisma.vehiculo.delete({ where: { id: vehiculoB.id } }).catch(() => {});
    await prisma.ubicacion.delete({ where: { id: ubicacionB.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
