// Lógica centralizada de estados de vencimiento.
// Un mismo criterio se usa para Activos, Documentos y Alertas
// para que "vigente / próximo / vencido" signifique siempre lo mismo en toda la plataforma.

export const DIAS_PROXIMO_A_VENCER = 30;

export type EstadoVencimiento = "VIGENTE" | "PROXIMO" | "VENCIDO" | "SIN_FECHA";

export function calcularEstadoVencimiento(
  fecha: Date | string | null | undefined
): EstadoVencimiento {
  if (!fecha) return "SIN_FECHA";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);

  const diffMs = f.getTime() - hoy.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "VENCIDO";
  if (diffDias <= DIAS_PROXIMO_A_VENCER) return "PROXIMO";
  return "VIGENTE";
}

export function calcularEstadoImpuesto(
  vencimiento: Date | string,
  fechaPago: Date | string | null | undefined
): "PAGADO" | "PENDIENTE" | "VENCIDO" {
  if (fechaPago) return "PAGADO";
  return calcularEstadoVencimiento(vencimiento) === "VENCIDO" ? "VENCIDO" : "PENDIENTE";
}

export function diasHasta(fecha: Date | string | null | undefined): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  return Math.round((f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}
