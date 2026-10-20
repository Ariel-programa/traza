// Auditoría de dependencias para CI: falla si aparece una vulnerabilidad
// high/critical que no esté en .audit-allowlist.json. Cada excepción lleva
// motivo y fecha de vencimiento: al vencer, el CI vuelve a fallar para que se
// revise. Nunca desactivar el escaneo entero; ignorar solo CVEs puntuales.
//
// Uso: npm run security:audit
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SEVERIDADES = new Set(["high", "critical"]);

const allowlist = JSON.parse(readFileSync(new URL("../.audit-allowlist.json", import.meta.url), "utf8"));
const hoy = new Date().toISOString().slice(0, 10);
const permitidas = new Map();
let falla = false;

for (const e of allowlist.exceptions) {
  if (e.until < hoy) {
    console.error(`VENCIDA  excepción ${e.advisory} (${e.package}) venció el ${e.until}: revisala. Motivo: ${e.reason}`);
    falla = true;
  } else {
    permitidas.set(e.advisory, e);
  }
}

let raw;
try {
  raw = execSync("npm audit --omit=dev --json", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  // npm audit sale con código != 0 cuando encuentra vulnerabilidades.
  raw = err.stdout;
}
const report = JSON.parse(raw);

const vistas = new Set();
for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== "object" || !SEVERIDADES.has(via.severity)) continue;
    const advisory = via.url?.split("/").pop();
    if (vistas.has(advisory)) continue;
    vistas.add(advisory);
    if (permitidas.has(advisory)) {
      console.log(`IGNORADA ${advisory} ${via.severity} en ${via.name} (vía ${pkg}) hasta ${permitidas.get(advisory).until}`);
    } else {
      console.error(`FALLA    ${advisory} ${via.severity} en ${via.name} (vía ${pkg}): ${via.title}`);
      falla = true;
    }
  }
}

if (falla) {
  console.error("\nHay vulnerabilidades high/critical sin resolver. Actualizá la dependencia o documentá la excepción en .audit-allowlist.json.");
  process.exit(1);
}
console.log("\nAuditoría OK: sin vulnerabilidades high/critical nuevas.");
