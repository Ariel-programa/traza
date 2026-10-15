"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      title="Volver atrás"
      aria-label="Volver atrás"
      className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
