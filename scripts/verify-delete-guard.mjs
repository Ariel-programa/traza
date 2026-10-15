// Verifica que no se puedan eliminar registros que tienen historial
// asociado (activos, vehiculos, proveedores, conductores, traslados):
// el Server Action debe redirigir con ?error=tiene-historial y el
// registro debe seguir existiendo en la base.
//
// Uso: npm run dev (en otra terminal) y despues: node scripts/verify-delete-guard.mjs
import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

function ok(label, condition) {
  console.log(`  ${condition ? "OK  " : "FAIL"}  ${label}`);
  if (!condition) process.exitCode = 1;
}

async function main() {
  const activoConMantenimiento = await prisma.mantenimiento.findFirst({ include: { activo: true } });
  const vehiculoConCarga = await prisma.combustibleCarga.findFirst({ include: { vehiculo: true } });
  const proveedorConActivos = await prisma.proveedor.findFirst({ where: { activos: { some: {} } } });
  const conductorConTraslados = await prisma.conductor.findFirst({ where: { traslados: { some: {} } } });
  const trasladoConGastos = await prisma.traslado.findFirst({ where: { gastos: { some: {} } } });
  if (
    !activoConMantenimiento ||
    !vehiculoConCarga ||
    !proveedorConActivos ||
    !conductorConTraslados ||
    !trasladoConGastos
  ) {
    throw new Error("No hay datos demo suficientes. Corre `npm run db:seed` primero.");
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", "admin@traza.local");
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);

    // Intentar borrar un activo con mantenimientos
    await page.goto(`${BASE_URL}/activos/${activoConMantenimiento.activoId}`);
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(new RegExp(`/activos/${activoConMantenimiento.activoId}\\?error=tiene-historial`)),
      page.click('main button:has-text("Eliminar")'),
    ]);
    const bannerVisible = await page.locator("text=No se puede eliminar este activo").isVisible();
    ok("activo con mantenimiento -> bloqueado con mensaje", bannerVisible);

    const activoStillExists = await prisma.activo.findUnique({ where: { id: activoConMantenimiento.activoId } });
    ok("activo sigue existiendo tras el intento de borrado", !!activoStillExists);

    // Intentar borrar un vehiculo con cargas de combustible (desde su ficha)
    await page.goto(`${BASE_URL}/flota/${vehiculoConCarga.vehiculoId}`);
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(`${BASE_URL}/flota?error=tiene-historial`),
      page.click('main button:has-text("Eliminar")'),
    ]);
    const bannerVehiculo = await page.locator("text=No se puede eliminar este vehículo").isVisible();
    ok("vehiculo con cargas -> bloqueado con mensaje", bannerVehiculo);

    const vehiculoStillExists = await prisma.vehiculo.findUnique({ where: { id: vehiculoConCarga.vehiculoId } });
    ok("vehiculo sigue existiendo tras el intento de borrado", !!vehiculoStillExists);

    // Intentar borrar un proveedor con activos asignados
    await page.goto(`${BASE_URL}/proveedores/${proveedorConActivos.id}`);
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(new RegExp(`/proveedores/${proveedorConActivos.id}\\?error=tiene-historial`)),
      page.click('main button:has-text("Eliminar")'),
    ]);
    const bannerProveedor = await page.locator("text=No se puede eliminar este proveedor").isVisible();
    ok("proveedor con activos -> bloqueado con mensaje", bannerProveedor);
    const proveedorStillExists = await prisma.proveedor.findUnique({ where: { id: proveedorConActivos.id } });
    ok("proveedor sigue existiendo tras el intento de borrado", !!proveedorStillExists);

    // Intentar borrar un conductor con traslados (desde su ficha)
    await page.goto(`${BASE_URL}/flota/conductores/${conductorConTraslados.id}`);
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(`${BASE_URL}/flota/conductores?error=tiene-historial`),
      page.click('main button:has-text("Eliminar")'),
    ]);
    const bannerConductor = await page.locator("text=No se puede eliminar este conductor").isVisible();
    ok("conductor con traslados -> bloqueado con mensaje", bannerConductor);
    const conductorStillExists = await prisma.conductor.findUnique({ where: { id: conductorConTraslados.id } });
    ok("conductor sigue existiendo tras el intento de borrado", !!conductorStillExists);

    // Intentar borrar un traslado con gastos asociados
    await page.goto(`${BASE_URL}/logistica/${trasladoConGastos.id}`);
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(new RegExp(`/logistica/${trasladoConGastos.id}\\?error=tiene-historial`)),
      page.click('main button:has-text("Eliminar")'),
    ]);
    const bannerTraslado = await page.locator("text=No se puede eliminar este traslado").isVisible();
    ok("traslado con gastos -> bloqueado con mensaje", bannerTraslado);
    const trasladoStillExists = await prisma.traslado.findUnique({ where: { id: trasladoConGastos.id } });
    ok("traslado sigue existiendo tras el intento de borrado", !!trasladoStillExists);

    if (process.exitCode === 1) {
      console.log("\nVERIFY DELETE GUARD: FALLO");
    } else {
      console.log("\nVERIFY DELETE GUARD: TODO OK");
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
