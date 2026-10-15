export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
      {children}
    </div>
  );
}
