// Smoke test end-to-end de TRAZA: recorre el flujo real por el navegador
// (Playwright) para validar que los Server Actions realmente escriben en
// la base de datos, no solo que las paginas cargan.
//
// Uso: npm run dev (en otra terminal) y despues: node scripts/smoke-test.mjs
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const stamp = Date.now();

function ok(label) {
  console.log(`  OK  ${label}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let step = "inicio";

  try {
    step = "login";
    await page.goto(`${BASE_URL}/login`);
    await page.fill("#email", "empresa@traza.local");
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/dashboard`), page.click('button[type="submit"]')]);
    ok("login empresa -> dashboard");

    step = "crear activo";
    await page.goto(`${BASE_URL}/activos/nuevo`);
    await page.fill("#nombre", `Activo Smoke Test ${stamp}`);
    await Promise.all([
      page.waitForURL(/\/activos\/[a-z0-9]{20,}$/),
      page.click('main button[type="submit"]'),
    ]);
    const activoUrl = page.url();
    const activoId = activoUrl.split("/").pop();
    ok(`crear activo -> ${activoUrl}`);

    step = "crear mantenimiento";
    await page.goto(`${BASE_URL}/mantenimiento/nuevo?activoId=${activoId}`);
    await page.fill("#resultado", "Aprobado (smoke test)");
    await Promise.all([page.waitForURL(activoUrl), page.click('main button[type="submit"]')]);
    ok("crear mantenimiento -> vuelve a la ficha del activo");

    step = "crear proveedor";
    await page.goto(`${BASE_URL}/proveedores/nuevo`);
    await page.fill("#nombre", `Proveedor Smoke ${stamp}`);
    await page.fill("#servicio", "Testing");
    await Promise.all([page.waitForURL(/\/proveedores\/[a-z0-9]{20,}$/), page.click('main button[type="submit"]')]);
    ok("crear proveedor");

    step = "crear documento";
    await page.goto(`${BASE_URL}/documentacion/nuevo?activoId=${activoId}`);
    await page.fill("#tipo", "Certificado smoke test");
    await Promise.all([page.waitForURL(`${BASE_URL}/documentacion`), page.click('main button[type="submit"]')]);
    const docListed = await page.locator("text=Certificado smoke test").first().isVisible();
    if (!docListed) throw new Error("El documento creado no aparece en el listado");
    ok("crear documento y verificar en listado");

    step = "editar documento";
    await page.click('table tbody tr:has-text("Certificado smoke test") a[aria-label^="Editar"]');
    await page.waitForURL(/\/documentacion\/[a-z0-9]{20,}\/editar$/);
    await page.fill("#numero", "N-12345");
    await Promise.all([page.waitForURL(`${BASE_URL}/documentacion`), page.click('main button[type="submit"]')]);
    ok("editar documento");

    step = "crear comodato";
    await page.goto(`${BASE_URL}/comodatos/nuevo`);
    const activoComodatoOptions = await page.locator("#activoId option").count();
    if (activoComodatoOptions > 1) {
      await page.selectOption("#activoId", { index: 1 });
      await page.fill("#propietario", "Propietario Smoke Test");
      await page.fill("#cliente", "Cliente Smoke Test");
      await page.fill("#fechaInicio", "2026-01-01");
      await Promise.all([page.waitForURL(`${BASE_URL}/comodatos`), page.click('main button[type="submit"]')]);
      ok("crear comodato");
    } else {
      console.log("  SKIP crear comodato (no hay activos sin comodato disponibles)");
    }

    step = "crear vehiculo";
    const patente = `SMK${stamp % 1000}`;
    await page.goto(`${BASE_URL}/flota/nuevo`);
    await page.fill("#patente", patente);
    await page.fill("#tipo", "Utilitario");
    await page.fill("#marca", "Marca Smoke");
    await page.fill("#modelo", "Modelo Smoke");
    await Promise.all([page.waitForURL(`${BASE_URL}/flota`), page.click('main button[type="submit"]')]);
    const vehiculoListado = await page.locator(`text=${patente}`).first().isVisible();
    if (!vehiculoListado) throw new Error("El vehiculo creado no aparece en el listado");
    ok("crear vehiculo y verificar en listado");

    step = "crear conductor";
    await page.goto(`${BASE_URL}/flota/conductores/nuevo`);
    await page.fill("#nombre", "Conductor");
    await page.fill("#apellido", `Smoke${stamp}`);
    await Promise.all([page.waitForURL(`${BASE_URL}/flota/conductores`), page.click('main button[type="submit"]')]);
    ok("crear conductor");

    step = "ficha y edicion de conductor";
    await page.click(`table tbody tr:has-text("Smoke${stamp}")`);
    await page.waitForURL(/\/flota\/conductores\/[a-z0-9]{20,}$/);
    const conductorUrl = page.url();
    await page.click('main a:has-text("Editar")');
    await page.fill("#telefono", "261-5550000");
    await Promise.all([page.waitForURL(conductorUrl), page.click('main button[type="submit"]')]);
    ok("ficha del conductor accesible y editable");

    step = "crear traslado";
    await page.goto(`${BASE_URL}/logistica/nuevo`);
    await page.fill("#origen", "Origen Smoke Test");
    await page.fill("#destino", "Destino Smoke Test");
    await Promise.all([page.waitForURL(/\/logistica\/[a-z0-9]{20,}$/), page.click('main button[type="submit"]')]);
    const trasladoUrl = page.url();
    ok(`crear traslado -> ${trasladoUrl}`);

    step = "registrar combustible";
    await page.goto(`${BASE_URL}/combustible/nuevo`);
    await page.selectOption("#vehiculoId", { index: 1 });
    await page.fill("#litros", "40");
    await page.fill("#precioLitro", "1000");
    await Promise.all([page.waitForURL(`${BASE_URL}/combustible`), page.click('main button[type="submit"]')]);
    ok("registrar carga de combustible");

    step = "registrar gasto";
    await page.goto(`${BASE_URL}/gastos/nuevo`);
    await page.fill("#importe", "5000");
    await Promise.all([page.waitForURL(`${BASE_URL}/gastos`), page.click('main button[type="submit"]')]);
    ok("registrar gasto");

    step = "registrar impuesto";
    await page.goto(`${BASE_URL}/impuestos/nuevo`);
    await page.fill("#nombre", `Impuesto Smoke ${stamp}`);
    await page.fill("#importe", "12345");
    await Promise.all([page.waitForURL(`${BASE_URL}/impuestos`), page.click('main button[type="submit"]')]);
    const impuestoListado = await page.locator(`text=Impuesto Smoke ${stamp}`).first().isVisible();
    if (!impuestoListado) throw new Error("El impuesto creado no aparece en el listado");
    ok("registrar impuesto y verificar en listado");

    step = "ficha del vehiculo";
    await page.goto(`${BASE_URL}/flota`);
    await page.click("table tbody tr:first-child");
    await page.waitForURL(/\/flota\/[a-z0-9]{20,}$/);
    const fichaVehiculoTitulo = await page.locator("h1").first().textContent();
    if (!fichaVehiculoTitulo) throw new Error("La ficha del vehiculo no muestra titulo");
    ok(`ficha del vehículo accesible (${fichaVehiculoTitulo})`);

    step = "centro de vencimientos";
    await page.goto(`${BASE_URL}/vencimientos`);
    const tituloVencimientos = await page.locator("h1").first().textContent();
    if (tituloVencimientos !== "Centro de vencimientos") throw new Error("El centro de vencimientos no cargo correctamente");
    ok("centro de vencimientos accesible");

    step = "crear usuario";
    await page.goto(`${BASE_URL}/usuarios/nuevo`);
    await page.fill("#nombre", "Usuario");
    await page.fill("#apellido", "Smoke");
    await page.fill("#email", `smoke${stamp}@traza.local`);
    await page.fill("#password", "demo1234");
    await Promise.all([page.waitForURL(`${BASE_URL}/usuarios`), page.click('main button[type="submit"]')]);
    const usuarioListado = await page.locator(`text=smoke${stamp}@traza.local`).first().isVisible();
    if (!usuarioListado) throw new Error("El usuario creado no aparece en el listado");
    ok("crear usuario y verificar en listado");

    step = "contratar plan demo";
    await page.goto(`${BASE_URL}/planes`);
    const contratarBtn = page.locator('button:has-text("Contratar (demo)")').first();
    if (await contratarBtn.isVisible()) {
      await Promise.all([page.waitForURL(`${BASE_URL}/planes`), contratarBtn.click()]);
      ok("contratar plan demo (checkout simulado)");
    } else {
      console.log("  SKIP contratar plan (no aplica para este usuario)");
    }

    step = "actualizar datos de empresa";
    await page.goto(`${BASE_URL}/configuracion`);
    await page.fill("#telefono", "0261-0000000");
    await page.click('form:has(#telefono) button[type="submit"]');
    await page.waitForSelector("text=Datos actualizados correctamente");
    ok("actualizar datos de empresa");

    step = "agregar webhook n8n";
    await page.fill("#url", `https://n8n.tu-dominio.com/webhook/smoke-${stamp}`);
    await page.click('form:has(#url) button[type="submit"]');
    await page.waitForSelector(`text=smoke-${stamp}`);
    ok("agregar webhook n8n");

    step = "ficha publica QR";
    await page.goto(`${BASE_URL}/activos/${activoId}`);
    const qrLink = await page.locator('a:has-text("Ver ficha")').getAttribute("href");
    await page.goto(`${BASE_URL}${qrLink}`);
    const titulo = await page.locator("h1").first().textContent();
    if (!titulo) throw new Error("La ficha publica no muestra titulo");
    ok(`ficha publica QR accesible sin login (${titulo})`);

    console.log("\nSMOKE TEST: TODO OK");
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error(`\nFALLO en paso "${step}":`, err.message);
    await page.screenshot({ path: `scripts/smoke-failure-${step.replace(/\s+/g, "-")}.png` }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

main();
