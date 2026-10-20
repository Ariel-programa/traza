import { PrismaClient, TipoActivo, Modalidad } from "@prisma/client";
import { generarQrSlug } from "../src/lib/qr-slug";

// Agrega 20 activos nuevos repartidos entre las 5 empresas demo del seed,
// sin borrar nada existente (a diferencia de prisma/seed.ts). Pensado para
// sumar volumen real al Dashboard sin resetear la base.
//
// Uso: npx tsx scripts/add-activos-demo.ts

const prisma = new PrismaClient();

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

const HOY = new Date();

const EMPRESAS = [
  "Bodega San Rafael S.A.",
  "Clínica Los Aromos",
  "Colegio Nuevo Horizonte",
  "Hotel Costanera Suites",
  "Distribuidora Andina Logística S.R.L.",
];

// tipo, nombre, marca — un template por activo a crear (4 por empresa = 20)
const TEMPLATES: [TipoActivo, string, string][] = [
  [TipoActivo.MATAFUEGO, "Matafuego ABC 5kg", "Drago"],
  [TipoActivo.EQUIPO_INFORMATICO, "Notebook de gestión", "Lenovo"],
  [TipoActivo.EQUIPO_ELECTRICO, "Tablero eléctrico general", "Schneider"],
  [TipoActivo.HERRAMIENTA, "Amoladora angular", "Makita"],
];

async function main() {
  console.log("Buscando empresas demo...");
  const empresas = await prisma.empresa.findMany({ where: { nombre: { in: EMPRESAS } } });
  if (empresas.length !== EMPRESAS.length) {
    const faltantes = EMPRESAS.filter((n) => !empresas.some((e) => e.nombre === n));
    throw new Error(
      `No se encontraron todas las empresas demo (¿corriste "npm run db:seed" antes?). Faltan: ${faltantes.join(", ")}`
    );
  }

  const ultimo = await prisma.activo.findFirst({
    where: { codigo: { startsWith: "AC-" } },
    orderBy: { codigo: "desc" },
  });
  let contador = ultimo ? parseInt(ultimo.codigo.replace("AC-", ""), 10) : 0;

  const creados = [];
  for (const empresa of empresas) {
    const ubicaciones = await prisma.ubicacion.findMany({ where: { empresaId: empresa.id } });
    const proveedores = await prisma.proveedor.findMany({ where: { empresaId: empresa.id } });

    for (let i = 0; i < TEMPLATES.length; i++) {
      const [tipo, nombre, marca] = TEMPLATES[i];
      contador++;
      const codigo = `AC-${pad(contador)}`;

      // Distribuir vencimientos: 1 vencido, 1 próximo a vencer, 2 vigentes por empresa.
      let offset: number;
      if (i === 0) offset = -randInt(2, 25);
      else if (i === 1) offset = randInt(1, 28);
      else offset = randInt(60, 365);
      const vencimiento = addDays(HOY, offset);

      const activo = await prisma.activo.create({
        data: {
          codigo,
          tipo,
          nombre,
          marca,
          modelo: `${marca.slice(0, 2).toUpperCase()}-${randInt(100, 999)}`,
          numeroSerie: `SN${randInt(100000, 999999)}`,
          estado: offset < 0 ? "VENCIDO" : offset <= 30 ? "PROXIMO_A_VENCER" : "VIGENTE",
          empresaId: empresa.id,
          ubicacionId: ubicaciones.length ? pick(ubicaciones).id : null,
          proveedorId: proveedores.length ? pick(proveedores).id : null,
          modalidad: i % 3 === 0 ? Modalidad.COMODATO : Modalidad.PROPIO,
          fechaAlta: addDays(HOY, -randInt(10, 200)),
          fechaAdquisicion: addDays(HOY, -randInt(10, 200)),
          ultimaInspeccion: addDays(HOY, -randInt(5, 90)),
          proximoVencimiento: vencimiento,
          qrSlug: generarQrSlug(codigo),
        },
      });
      creados.push(activo);
      console.log(`  + ${codigo} · ${nombre} · ${empresa.nombre} · vence ${vencimiento.toISOString().slice(0, 10)}`);
    }
  }

  console.log(`\nListo: ${creados.length} activos nuevos creados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
