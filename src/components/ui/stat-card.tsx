import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  stripe = false,
  spark,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "accent";
  /** Franja lateral de color -- solo para tarjetas que realmente requieren atención (el color ya tiene significado vía `tone`, no es decorativo). */
  stripe?: boolean;
  /** Serie histórica real (ver lib/dashboard.ts). No pasar datos inventados. */
  spark?: number[];
  /** Si se pasa, todo el KPI lleva a su módulo correspondiente. */
  href?: string;
}) {
  const toneClass: Record<string, string> = {
    neutral: "text-[var(--text-primary)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    danger: "text-[var(--danger)]",
    brand: "text-[var(--brand)]",
    accent: "text-[var(--accent-hover)]",
  };
  const chipClass: Record<string, string> = {
    neutral: "bg-[var(--surface-muted)] text-[var(--text-muted)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
    brand: "bg-[var(--brand-soft)] text-[var(--brand)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent-hover)]",
  };
  const stripeClass: Record<string, string> = {
    neutral: "before:bg-[var(--text-muted)]",
    success: "before:bg-[var(--success)]",
    warning: "before:bg-[var(--warning)]",
    danger: "before:bg-[var(--danger)]",
    brand: "before:bg-[var(--brand)]",
    accent: "before:bg-[var(--accent)]",
  };
  const content = (
    <Card
      className={cn(
        "p-4 relative overflow-hidden h-full transition-colors",
        stripe && "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]",
        stripe && stripeClass[tone],
        href && "hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] group"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", chipClass[tone])}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn("mt-3 text-kpi truncate", toneClass[tone])} title={String(value)}>{value}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2 min-w-0">
        {hint ? <p className="text-xs text-[var(--text-muted)] truncate">{hint}</p> : <span />}
        {href && (
          <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden="true" />
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-2">
          <Sparkline data={spark} width={110} height={26} />
        </div>
      )}
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-[var(--radius-lg)]" aria-label={`Ver ${label}`}>
      {content}
    </Link>
  );
}
