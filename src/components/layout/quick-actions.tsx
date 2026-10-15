"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { QUICK_ACTIONS } from "@/components/layout/nav-config";
import type { Rol } from "@prisma/client";

export function QuickActions({ rol }: { rol: Rol }) {
  const acciones = QUICK_ACTIONS.filter((a) => !a.roles || a.roles.includes(rol));
  if (acciones.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Nueva acción
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {acciones.map((a) => (
          <DropdownMenuItem key={a.href} asChild>
            <Link href={a.href}>
              <a.icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              {a.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
