"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-[220px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)]",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-[var(--text-secondary)] outline-none cursor-pointer select-none",
        "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:bg-[var(--surface-hover)] focus-visible:text-[var(--text-primary)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]", className)}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel };
