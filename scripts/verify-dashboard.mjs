// Verifica el Dashboard rediseñado contra datos reales y aislamiento
// multi-tenant: crea dos empresas temporales con cantidades conocidas de
// activos/gastos/vehículos, entra como cada una y confirma que las tarjetas,
// "Gastos por categoría" y la actividad reciente muestran exactamente lo
// que le pertenece a esa empresa -- nunca los datos de la otra. También
// confirma que un alta real por la UI aparece en la línea de tiempo.
//
// Uso: npm run dev (en otra terminal) y después: node scripts/verify-dashboard.mjs
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function ok(label, condition) {
  console.log(`  ${condition ? "OK  " : "FAIL"}  ${label}`);
  if (!condition) process.exitCode = 1;
}

async function loginAs(page, email) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);
  await waitForDashboard(page);
}

// El Dashboard tiene loading.tsx (Suspense): esperamos un heading que solo
// existe una vez que getDashboardData() resolvió, para no leer el skeleton.
async function waitForDashboard(page) {
  await page.waitForSelector("text=Gastos por categoría", { timeout: 15000 });
}

async function main() {
  const stamp = Date.now();
  const hoy = new Date();

  const empresaA = await prisma.empresa.create({ data: { nombre: `Dash Verify A ${stamp}` } });
  const empresaB = await prisma.empresa.create({ data: { nombre: `Dash Verify B ${stamp}` } });

  const userA = await prisma.user.create({
    data: {
      email: `verify-dash-a-${stamp}@traza.local`,
      passwordHash: await bcrypt.hash("demo1234", 10),
      nombre: "DashA",
      apellido: "Test",
      rol: "EMPRESA",
      empresaId: empresaA.id,
      activo: true,
    },
  });
  const userB = await prisma.user.create({
    data: {
      email: `verify-dash-b-${stamp}@traza.local`,
      passwordHash: await bcrypt.hash("demo1234", 10),
      nombre: "DashB",
      apellido: "Test",
      rol: "EMPRESA",
      empresaId: empresaB.id,
      activo: true,
    },
  });

  // Cantidades conocidas de antemano para poder afirmar valores exactos.
  // (el cleanup en el finally barre por empresaId, no necesita estos ids).
  await Promise.all(
    [1, 2].map((n) =>
      prisma.activo.create({
        data: {
          codigo: `DVA-${stamp}-${n}`,
          qrSlug: `dva-${stamp}-${n}`,
          tipo: "OTRO",
          nombre: `Activo A${n}`,
          empresaId: empresaA.id,
        },
      })
    )
  );
  await prisma.activo.create({
    data: { codigo: `DVB-${stamp}-1`, qrSlug: `dvb-${stamp}-1`, tipo: "OTRO", nombre: "Activo B1", empresaId: empresaB.id },
  });

  await prisma.gasto.create({
    data: { empresaId: empresaA.id, categoria: "COMBUSTIBLE", importe: 12345, fecha: hoy },
  });
  await prisma.gasto.create({
    data: { empresaId: empresaB.id, categoria: "PEAJE", importe: 987, fecha: hoy },
  });

  await prisma.vehiculo.create({
    data: { empresaId: empresaA.id, patente: `DVA${stamp % 10000}`, marca: "Test", modelo: "Test", tipo: "Auto", estado: "DISPONIBLE" },
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // --- Empresa A ---
    await loginAs(page, userA.email);
    const bodyA1 = await page.locator("main").innerText();

    // Chequeo numérico directo contra la fuente real (Prisma), no contra el string de la UI:
    // así la prueba no depende de layout/copy, sino de que el conteo real coincida.
    const activosCountA = await prisma.activo.count({ where: { empresaId: empresaA.id } });
    ok("Empresa A tiene exactamente 2 activos en la base (fixture)", activosCountA === 2);
    const activosCountB = await prisma.activo.count({ where: { empresaId: empresaB.id } });
    ok("Empresa B tiene exactamente 1 activo en la base (fixture), distinto de A", activosCountB === 1 && activosCountB !== activosCountA);

    // Los labels de StatCard se muestran en mayúsculas (CSS uppercase) y el
    // valor está a 2 caracteres de distancia ("LABEL\n\nVALOR"): la ventana
    // se mantiene corta a propósito para no confundir esto con, por ejemplo,
    // los ticks del eje del gráfico "Activos por tipo".
    ok('La tarjeta "Activos" de A muestra 2 (coincide con la base)', /Activos[\s\S]{0,6}?\b2\b/i.test(bodyA1));
    ok('La tarjeta "Vehículos" de A muestra 1 (coincide con la base)', /Vehículos[\s\S]{0,6}?\b1\b/i.test(bodyA1));
    ok("El dashboard de A muestra el importe de su propio gasto ($12.345)", bodyA1.includes("12.345") || bodyA1.includes("12345"));
    ok("El dashboard de A NO muestra el importe del gasto de B ($987)", !bodyA1.includes("$ 987") && !/\b987\b/.test(bodyA1.replace(/12345|12\.345/g, "")));
    ok('"Gastos por categoría" de A muestra Combustible (su categoría real)', /Combustible/i.test(bodyA1));

    // Alta real por la UI -> debe generar un AuditLog real -> debe aparecer en la timeline de A.
    await page.goto(`${BASE_URL}/activos/nuevo`);
    await page.fill("#nombre", `Activo timeline ${stamp}`);
    await page.click('main button[type="submit"]');
    await page.waitForURL(/\/activos\/[a-z0-9]{15,}/);
    const activoUiId = page.url().split("/activos/")[1];
    const activoUiRow = await prisma.activo.findUnique({ where: { id: activoUiId } });
    ok("El alta por la UI creó un Activo real en la base, en la empresa correcta", activoUiRow?.empresaId === empresaA.id);

    await page.goto(`${BASE_URL}/dashboard`);
    await waitForDashboard(page);
    const bodyA2 = await page.locator("main").innerText();
    ok('Después del alta real, "Actividad reciente" de A deja de estar vacía', !/Sin actividad reciente/.test(bodyA2));
    ok('La actividad muestra "creó un activo" (verbo real desde AuditLog)', /cre[oó] un activo/i.test(bodyA2));

    // --- Empresa B: aislamiento del feed de actividad ---
    await page.context().clearCookies();
    await loginAs(page, userB.email);
    const bodyB = await page.locator("main").innerText();

    ok('La tarjeta "Activos" de B muestra 1, no los 2 de A', /Activos[\s\S]{0,6}?\b1\b/i.test(bodyB));
    ok("El dashboard de B muestra su propio gasto ($987)", /987/.test(bodyB));
    ok("El dashboard de B NO muestra el gasto de A ($12.345)", !bodyB.includes("12.345") && !bodyB.includes("12345"));
    ok('"Actividad reciente" de B NO muestra el alta de activo hecha por A (aislamiento)', !/Activo timeline/.test(bodyB));

    if (process.exitCode === 1) {
      console.log("\nVERIFY DASHBOARD: FALLO");
    } else {
      console.log("\nVERIFY DASHBOARD: TODO OK");
    }
  } finally {
    await browser.close();
    // Barrido por empresaId (no por id puntual): así, si algún borrado
    // individual falló o `activoUiId` quedó mal capturado, igual no queda
    // ningún hijo huérfano bloqueando el borrado de la empresa por FK.
    const empresaIds = [empresaA.id, empresaB.id];
    await prisma.auditLog.deleteMany({ where: { empresaId: { in: empresaIds } } }).catch(() => {});
    await prisma.gasto.deleteMany({ where: { empresaId: { in: empresaIds } } }).catch(() => {});
    await prisma.vehiculo.deleteMany({ where: { empresaId: { in: empresaIds } } }).catch(() => {});
    await prisma.activo.deleteMany({ where: { empresaId: { in: empresaIds } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { empresaId: { in: empresaIds } } }).catch(() => {});
    await prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
