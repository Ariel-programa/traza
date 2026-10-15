"use client";

import { Receipt } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";

export function TicketPreview({ fotoTicket }: { fotoTicket: string | null }) {
  if (!fotoTicket) return <span className="text-[var(--text-muted)]">—</span>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:underline"
          aria-label="Ver foto del ticket"
        >
          <Receipt className="h-3.5 w-3.5" /> Ver
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL guardado en la base, no aplica next/image */}
        <img src={fotoTicket} alt="Foto del ticket de combustible" className="w-full rounded-[var(--radius-sm)]" />
        <DialogClose asChild>
          <button type="button" className="mt-3 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Cerrar
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
