import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-[var(--surface-muted)]">
      <Logo />
      <div>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">404</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">No encontramos la página que buscás.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </div>
  );
}
