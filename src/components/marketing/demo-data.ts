// Datos de demostración de la landing -- una sola fuente para todas las
// secciones. Salen del escenario demo de prisma/seed.ts ("Distribuidora
// Andina Logística S.R.L.": mismas patentes, modelos, conductores, ciudades,
// estaciones y formato de numeración). Siempre se muestran rotulados como
// demo; no son métricas ni clientes reales.

export type Tone = "success" | "info" | "warning" | "danger" | "muted";

export const EMPRESA_DEMO = "Distribuidora Andina Logística";

export const TRASLADO_DEMO = {
  numero: "TR-0014",
  origen: "Mendoza",
  destino: "Rosario",
  cliente: "Supermercados Oeste",
  vehiculo: { patente: "AF012JK", modelo: "Toyota Hilux" },
  conductor: "Lorena Benítez",
};

// Estados reales de EstadoVehiculo (schema.prisma)
export const ESTADO_VEHICULO = {
  DISPONIBLE: { label: "Disponible", tone: "success" },
  EN_VIAJE: { label: "En viaje", tone: "info" },
  EN_MANTENIMIENTO: { label: "En mantenimiento", tone: "warning" },
  FUERA_DE_SERVICIO: { label: "Fuera de servicio", tone: "danger" },
} as const satisfies Record<string, { label: string; tone: Tone }>;

export type EstadoVehiculo = keyof typeof ESTADO_VEHICULO;

export const FLOTA_DEMO: {
  patente: string;
  vehiculo: string;
  tipo: string;
  km: number;
  estado: EstadoVehiculo;
  proximo: { texto: string; tone: Tone };
}[] = [
  { patente: "AC123DE", vehiculo: "Ford Transit", tipo: "Furgón", km: 84210, estado: "EN_VIAJE", proximo: { texto: "Service en 18 días", tone: "muted" } },
  { patente: "AD456FG", vehiculo: "Mercedes-Benz Sprinter", tipo: "Furgón", km: 61870, estado: "DISPONIBLE", proximo: { texto: "VTV en 9 días", tone: "warning" } },
  { patente: "AE789HI", vehiculo: "Iveco Daily", tipo: "Camión liviano", km: 132540, estado: "EN_MANTENIMIENTO", proximo: { texto: "Service vencido", tone: "danger" } },
  { patente: "AF012JK", vehiculo: "Toyota Hilux", tipo: "Camioneta", km: 38950, estado: "EN_VIAJE", proximo: { texto: "Seguro en 64 días", tone: "muted" } },
  { patente: "AG345LM", vehiculo: "Volkswagen Amarok", tipo: "Camioneta", km: 71300, estado: "DISPONIBLE", proximo: { texto: "VTV al día", tone: "success" } },
  { patente: "AH678NO", vehiculo: "Renault Kangoo", tipo: "Utilitario", km: 118420, estado: "FUERA_DE_SERVICIO", proximo: { texto: "Seguro vencido", tone: "danger" } },
];

// Categorías reales de CategoriaGasto; importes de ejemplo (ARS, un mes).
export const GASTOS_DEMO: { categoria: string; importe: number }[] = [
  { categoria: "Combustible", importe: 1842300 },
  { categoria: "Mantenimiento", importe: 694500 },
  { categoria: "Peaje", importe: 238900 },
  { categoria: "Seguro", importe: 512000 },
  { categoria: "Reparación", importe: 301750 },
  { categoria: "Otros", importe: 88400 },
];

// Estaciones del seed; importe = litros × precio por litro.
export const TICKET_DEMO = {
  estacion: "YPF Ruta 40",
  producto: "Nafta Premium",
  litros: 48.2,
  precioLitro: 1012,
  importe: 48778.4,
  km: 38950,
  patente: "AF012JK",
};

// EstadoDocumento real: VIGENTE / PROXIMO_A_VENCER / VENCIDO.
// `dias` = días hasta el vencimiento (negativo = vencido).
export const DOCUMENTOS_DEMO: { tipo: string; entidad: string; entidadTipo: string; dias: number }[] = [
  { tipo: "Seguro", entidad: "AH678NO", entidadTipo: "Vehículo", dias: -12 },
  { tipo: "Licencia de conducir", entidad: "Hugo Farías", entidadTipo: "Conductor", dias: -3 },
  { tipo: "VTV", entidad: "AD456FG", entidadTipo: "Vehículo", dias: 9 },
  { tipo: "Habilitación", entidad: "Distribuidora Andina", entidadTipo: "Empresa", dias: 22 },
  { tipo: "Seguro", entidad: "AF012JK", entidadTipo: "Vehículo", dias: 64 },
  { tipo: "Licencia de conducir", entidad: "Lorena Benítez", entidadTipo: "Conductor", dias: 168 },
];

export function estadoDocumento(dias: number): { label: string; tone: Tone } {
  if (dias < 0) return { label: "Vencido", tone: "danger" };
  if (dias <= 30) return { label: "Próximo a vencer", tone: "warning" };
  return { label: "Vigente", tone: "success" };
}
