// Heurísticas para extraer datos de un ticket de carga de combustible a
// partir del texto crudo que devuelve el OCR. Los tickets de estaciones de
// servicio argentinas (YPF, Shell, Axion, Puma, etc.) comparten un formato
// razonablemente consistente: nombre de la estación arriba, y más abajo
// litros / precio por litro / total, cada uno en su propia línea o junto a
// una etiqueta. No hay IA de por medio: son regex sobre texto ya reconocido.
export type TicketParseResult = {
  estacion?: string;
  litros?: number;
  precioLitro?: number;
  importe?: number;
  fecha?: string; // yyyy-mm-dd, listo para <input type="date">
};

function toNumber(raw: string): number | undefined {
  // Tickets suelen usar "." como separador de miles y "," como decimal
  // (formato AR). Si no hay coma, asumimos que el punto ya es decimal.
  const cleaned = raw.trim();
  const n = cleaned.includes(",")
    ? Number(cleaned.replace(/\./g, "").replace(",", "."))
    : Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

const NUM = String.raw`(\d{1,3}(?:[.,]\d{1,3})*(?:[.,]\d{1,2})?)`;

export function parseTicketText(text: string): TicketParseResult {
  const result: TicketParseResult = {};
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  const litrosMatch = normalized.match(new RegExp(String.raw`(?:LITROS?|LTS?\.?|VOL(?:UMEN)?)[\s:]*${NUM}`, "i"));
  if (litrosMatch) result.litros = toNumber(litrosMatch[1]);

  const precioMatch = normalized.match(
    new RegExp(String.raw`(?:PRECIO\s*(?:X|POR)?\s*L(?:I?TRO)?|P\.?\s*U\.?|\$\s*\/\s*L)[\s:]*\$?[\s]*${NUM}`, "i")
  );
  if (precioMatch) result.precioLitro = toNumber(precioMatch[1]);

  const totalMatch = normalized.match(new RegExp(String.raw`(?:TOTAL|IMPORTE)[\s:]*\$?[\s]*${NUM}`, "i"));
  if (totalMatch) result.importe = toNumber(totalMatch[1]);

  // Si el ticket no trae precio por litro explícito pero sí litros y total,
  // lo derivamos (evita dejar el campo vacío en tickets más simples).
  if (!result.precioLitro && result.importe && result.litros) {
    result.precioLitro = Math.round((result.importe / result.litros) * 100) / 100;
  }

  const fechaMatch = normalized.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
  if (fechaMatch) {
    const [, d, m] = fechaMatch;
    let y = fechaMatch[3];
    if (y.length === 2) y = `20${y}`;
    result.fecha = `${y}-${m}-${d}`;
  }

  // La estación no tiene una etiqueta fija -- se infiere de la primera línea
  // "razonable" (letras, sin ser puro número/fecha), típicamente el
  // encabezado del ticket con el nombre de la marca/sucursal.
  const marcaConocida = lines.find((l) => /\b(YPF|SHELL|AXION|PUMA|GULF|REFINOR|VOY)\b/i.test(l));
  if (marcaConocida) {
    result.estacion = marcaConocida.replace(/[^\p{L}\p{N}\s.-]/gu, "").trim();
  } else {
    const primeraLineaTexto = lines.find((l) => /[a-zA-ZÀ-ÿ]{3,}/.test(l) && !/CUIT|FACTURA|TICKET/i.test(l));
    if (primeraLineaTexto) result.estacion = primeraLineaTexto.slice(0, 60);
  }

  return result;
}
