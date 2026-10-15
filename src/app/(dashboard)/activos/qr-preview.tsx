"use client";

import Image from "next/image";
import Link from "next/link";
import { QrCode, Printer, ExternalLink } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { tipoActivoLabel } from "@/lib/format";
import type { Activo } from "@prisma/client";

type Props = Pick<Activo, "id" | "codigo" | "nombre" | "tipo" | "qrSlug">;

export function QrPreview({ activo }: { activo: Props }) {
  // La fila de la tabla navega a la ficha al hacer click/Enter. Los eventos del
  // diálogo (aunque esté en un portal) burbujean por el árbol de React hasta la
  // fila, así que se cortan acá para que abrir/cerrar el QR no navegue.
  return (
    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-[var(--brand)] hover:underline"
            aria-label={`Ver QR de ${activo.codigo}`}
          >
            <QrCode className="h-3.5 w-3.5" /> Ver QR
          </button>
        </DialogTrigger>
        <DialogContent className="w-72 p-5 flex flex-col items-center text-center" aria-describedby={undefined}>
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{tipoActivoLabel(activo.tipo)}</p>
          <DialogTitle className="text-lg font-mono font-bold mt-0.5">{activo.codigo}</DialogTitle>
          <p className="text-xs text-[var(--text-muted)] truncate w-full">{activo.nombre}</p>
          <div className="my-4 rounded-[var(--radius-sm)] p-2 bg-white">
            <Image src={`/api/qr/${activo.qrSlug}`} alt={`QR de ${activo.codigo}`} width={180} height={180} unoptimized />
          </div>
          <div className="flex gap-2 w-full">
            <Button asChild size="sm" variant="secondary" className="flex-1">
              <Link href={`/qr/${activo.id}/imprimir`}><Printer className="h-3.5 w-3.5" /> Imprimir</Link>
            </Button>
            <Button asChild size="sm" variant="secondary" className="flex-1">
              <Link href={`/public/activo/${activo.qrSlug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Ficha</Link>
            </Button>
          </div>
          <DialogClose asChild>
            <button type="button" className="mt-3 w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Cerrar
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </span>
  );
}
