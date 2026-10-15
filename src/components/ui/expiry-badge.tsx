import { AlertCircle, AlertTriangle, Clock, CheckCircle2, CircleDashed } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sistema de prioridad visual unico para todo lo que tiene fecha de
// vencimiento (activos, documentos, vehiculos, mantenimientos, impuestos).
// La franja horaria es deliberadamente mas fina que el estado de 3 valores
// que persiste la base (VIGENTE/PROXIMO_A_VENCER/VENCIDO): esta es una
// capa de presentacion derivada de los dias restantes, no reemplaza ni
// recalcula el estado guardado.
export type Urgencia = "critico" | "importante" | "proximo" | "ok" | "sin_fecha";

export function urgenciaDesdeDias(dias: number | null): Urgencia {
  if (dias === null) return "sin_fecha";
  if (dias < 0) return "critico";
  if (dias <= 7) return "importante";
  if (dias <= 30) return "proximo";
  return "ok";
}

const CONFIG: Record<
  Urgencia,
  { variant: BadgeProps["variant"]; Icon: React.ComponentType<{ className?: string }>; label: (dias: number | null) => string }
> = {
  critico: {
    variant: "danger",
    Icon: AlertCircle,
    label: (dias) => `Vencido hace ${Math.abs(dias ?? 0)}d`,
  },
  importante: {
    variant: "warning",
    Icon: AlertTriangle,
    label: (dias) => (dias === 0 ? "Vence hoy" : `Vence en ${dias}d`),
  },
  proximo: {
    variant: "caution",
    Icon: Clock,
    label: (dias) => `Vence en ${dias}d`,
  },
  ok: {
    variant: "success",
    Icon: CheckCircle2,
    label: () => "Vigente",
  },
  sin_fecha: {
    variant: "neutral",
    Icon: CircleDashed,
    label: () => "Sin fecha",
  },
};

export function ExpiryBadge({ dias, className }: { dias: number | null; className?: string }) {
  const urgencia = urgenciaDesdeDias(dias);
  const cfg = CONFIG[urgencia];
  const Icon = cfg.Icon;
  return (
    <Badge variant={cfg.variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {cfg.label(dias)}
    </Badge>
  );
}

// Sin badge, solo los datos -- util para listas propias (Centro de
// Vencimientos, panel "Requiere atención") que arman su propio layout.
export function urgenciaConfig(dias: number | null) {
  const urgencia = urgenciaDesdeDias(dias);
  const cfg = CONFIG[urgencia];
  return { urgencia, variant: cfg.variant, Icon: cfg.Icon, label: cfg.label(dias) };
}
