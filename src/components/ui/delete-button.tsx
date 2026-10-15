"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  confirmMessage = "¿Seguro que querés eliminar este registro? Esta acción no se puede deshacer.",
  label = "Eliminar",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant="destructive" size="sm" title="Eliminar" aria-label={label || "Eliminar"}>
        <Trash2 className="h-3.5 w-3.5" /> {label}
      </Button>
    </form>
  );
}
