export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    value
  );
}

export function formatNumero(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(date)
  );
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativo(date: Date | string) {
  const f = new Date(date);
  const diffMs = Date.now() - f.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "Ayer";
  if (diffD < 7) return `Hace ${diffD}d`;
  return formatDate(f);
}

export function saludoHorario(hora: number = new Date().getHours()) {
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function formatFechaLarga(date: Date = new Date()) {
  const s = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function tipoActivoLabel(tipo: string) {
  const map: Record<string, string> = {
    MATAFUEGO: "Matafuego",
    EQUIPO_MEDICO: "Equipo médico",
    EQUIPO_INFORMATICO: "Equipo informático",
    HERRAMIENTA: "Herramienta",
    MAQUINARIA: "Maquinaria",
    ALARMA: "Alarma",
    EQUIPO_CONTRA_INCENDIO: "Equipo contra incendio",
    EQUIPO_ELECTRICO: "Equipo eléctrico",
    VEHICULO: "Vehículo",
    OTRO: "Otro",
  };
  return map[tipo] ?? tipo;
}

export function tipoMantenimientoLabel(tipo: string) {
  const map: Record<string, string> = {
    INSPECCION: "Inspección",
    MANTENIMIENTO: "Mantenimiento",
    REPARACION: "Reparación",
    RECARGA: "Recarga",
    CALIBRACION: "Calibración",
    INSTALACION: "Instalación",
    RETIRO: "Retiro",
    OTRO: "Otro",
  };
  return map[tipo] ?? tipo;
}

export function categoriaGastoLabel(cat: string) {
  const map: Record<string, string> = {
    COMBUSTIBLE: "Combustible",
    PEAJE: "Peaje",
    MANTENIMIENTO: "Mantenimiento",
    REPARACION: "Reparación",
    ENVIO: "Envío",
    SEGURO: "Seguro",
    OTROS: "Otros",
  };
  return map[cat] ?? cat;
}
