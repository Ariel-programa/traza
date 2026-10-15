import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--neutral-soft)] text-[var(--text-secondary)]",
        success: "bg-[var(--success-soft)] text-[var(--success)]",
        warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
        caution: "bg-[var(--caution-soft)] text-[var(--caution)]",
        danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
        info: "bg-[var(--info-soft)] text-[var(--info)]",
        brand: "bg-[var(--brand-soft)] text-[var(--brand)]",
        accent: "bg-[var(--accent-soft)] text-[var(--accent-hover)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-[var(--success)]",
            variant === "warning" && "bg-[var(--warning)]",
            variant === "caution" && "bg-[var(--caution)]",
            variant === "danger" && "bg-[var(--danger)]",
            variant === "info" && "bg-[var(--info)]",
            variant === "brand" && "bg-[var(--brand)]",
            variant === "accent" && "bg-[var(--accent)]",
            (!variant || variant === "neutral") && "bg-[var(--text-muted)]"
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
