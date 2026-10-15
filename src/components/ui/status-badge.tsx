import { Badge } from "@/components/ui/badge";

type Variant = "neutral" | "success" | "warning" | "caution" | "danger" | "info" | "brand";

const ESTADO_MAP: Record<string, { label: string; variant: Variant }> = {
  VIGENTE: { label: "Vigente", variant: "success" },
  PROXIMO_A_VENCER: { label: "Próximo a vencer", variant: "warning" },
  PROXIMO: { label: "Próximo a vencer", variant: "warning" },
  VENCIDO: { label: "Vencido", variant: "danger" },
  SIN_FECHA: { label: "Sin fecha", variant: "neutral" },
  EN_MANTENIMIENTO: { label: "En mantenimiento", variant: "info" },
  FUERA_DE_SERVICIO: { label: "Fuera de servicio", variant: "neutral" },
  RETIRADO: { label: "Retirado", variant: "neutral" },
  ACTIVO: { label: "Activo", variant: "success" },
  INACTIVO: { label: "Inactivo", variant: "neutral" },
  DISPONIBLE: { label: "Disponible", variant: "success" },
  EN_VIAJE: { label: "En viaje", variant: "info" },
  PLANIFICADO: { label: "Planificado", variant: "info" },
  EN_CURSO: { label: "En curso", variant: "brand" },
  COMPLETADO: { label: "Completado", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "neutral" },
  PROPIO: { label: "Propio", variant: "neutral" },
  COMODATO: { label: "Comodato", variant: "info" },
  APROBADO: { label: "Aprobado", variant: "success" },
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  RECHAZADO: { label: "Rechazado", variant: "danger" },
  DEMO: { label: "Demo", variant: "brand" },
  VENCIDA: { label: "Vencida", variant: "danger" },
  PAGADO: { label: "Pagado", variant: "success" },
};

export function StatusBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_MAP[estado] ?? { label: estado, variant: "neutral" as Variant };
  return (
    <Badge variant={cfg.variant} dot>
      {cfg.label}
    </Badge>
  );
}
