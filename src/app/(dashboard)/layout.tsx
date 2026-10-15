import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { ScrollableMain } from "@/components/layout/scrollable-main";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const empresa = session.empresaId
    ? await prisma.empresa.findUnique({ where: { id: session.empresaId } })
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <CommandPalette />
      <Sidebar rol={session.rol} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar nombre={session.nombre} rol={session.rol} empresa={empresa?.nombre} />
        <ScrollableMain>{children}</ScrollableMain>
      </div>
    </div>
  );
}
