// Regenera el qrSlug de los activos que todavía usan el formato adivinable
// (slug == código en minúsculas, ej. "mf-00001"). Ver src/lib/qr-slug.ts.
//
// OJO: invalida las etiquetas QR ya impresas de esos activos (hay que
// reimprimirlas desde /qr/[id]/imprimir). Correr una sola vez antes de salir
// a producción.
//
// Uso: npx tsx scripts/rotar-qr-slugs.ts            (muestra cuántos cambiaría)
//      npx tsx scripts/rotar-qr-slugs.ts --confirm  (los regenera)
import { PrismaClient } from "@prisma/client";
import { generarQrSlug } from "../src/lib/qr-slug";

const prisma = new PrismaClient();

async function main() {
  const activos = await prisma.activo.findMany({ select: { id: true, codigo: true, qrSlug: true } });
  const pendientes = activos.filter((a) => a.qrSlug === a.codigo.toLowerCase());
  console.log(`${pendientes.length} de ${activos.length} activos tienen un qrSlug adivinable.`);
  if (!process.argv.includes("--confirm")) {
    console.log("Corré de nuevo con --confirm para regenerarlos.");
    return;
  }
  for (const a of pendientes) {
    await prisma.activo.update({ where: { id: a.id }, data: { qrSlug: generarQrSlug(a.codigo) } });
  }
  console.log(`Listo: ${pendientes.length} slugs regenerados. Reimprimí sus etiquetas QR.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
