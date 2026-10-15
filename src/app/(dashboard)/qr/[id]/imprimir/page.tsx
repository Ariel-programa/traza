import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { formatDate, tipoActivoLabel } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export default async function ImprimirQrPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const activo = await prisma.activo.findUnique({ where: { id } });
  if (!activo) notFound();
  if (session.rol !== "ADMIN" && activo.empresaId !== session.empresaId) notFound();

  return (
    <div className="flex flex-col items-center py-6">
      <div className="w-full max-w-xs flex items-center justify-between mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/activos/${activo.id}`}><ArrowLeft className="h-3.5 w-3.5" /> Volver</Link>
        </Button>
        <PrintButton />
      </div>

      <div className="w-72 border-2 border-[#0f1522] rounded-[var(--radius-md)] p-5 flex flex-col items-center text-center bg-white print:border print:shadow-none">
        <p className="text-sm font-bold tracking-wide">TRAZA</p>
        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)] mt-2">{tipoActivoLabel(activo.tipo)}</p>
        <p className="text-lg font-mono font-bold mt-0.5">{activo.codigo}</p>

        <div className="my-4">
          <Image src={`/api/qr/${activo.qrSlug}`} alt={activo.codigo} width={160} height={160} unoptimized />
        </div>

        <div className="mb-2">
          <StatusBadge estado={activo.estado} />
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Próximo vencimiento: <span className="font-medium text-[var(--text-primary)]">{formatDate(activo.proximoVencimiento)}</span>
        </p>
      </div>
    </div>
  );
}
