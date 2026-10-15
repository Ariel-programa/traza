"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { globalSearch, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

// Buscador global (Ctrl+K / ⌘K). Vive una sola vez en el layout del panel
// y escucha el atajo en toda la app -- no depende de que el usuario esté
// en el topbar. Reusa el mismo motor de búsqueda que /buscar.
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Se dispara solo cuando hay una búsqueda vigente (>= 2 caracteres); si el
  // usuario borra el texto, la búsqueda anterior queda sin usar (ver
  // `effectiveResults` más abajo) en vez de limpiarse síncronamente acá.
  React.useEffect(() => {
    if (query.trim().length < 2) return;
    let ignore = false;
    const id = setTimeout(() => {
      setPending(true);
      globalSearch(query).then((r) => {
        if (ignore) return;
        setResults(r);
        setActiveIndex(0);
        setPending(false);
      });
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(id);
    };
  }, [query]);

  const effectiveResults = React.useMemo(
    () => (query.trim().length < 2 ? [] : results),
    [query, results]
  );

  const grouped = React.useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of effectiveResults) {
      map.set(r.group, [...(map.get(r.group) ?? []), r]);
    }
    return Array.from(map.entries());
  }, [effectiveResults]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }

  function goTo(result: SearchResult) {
    setOpen(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, effectiveResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && effectiveResults[activeIndex]) {
      e.preventDefault();
      goTo(effectiveResults[activeIndex]);
    }
  }

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        glass
        aria-label="Buscar en TRAZA"
        className="w-[92vw] max-w-lg p-0 overflow-hidden top-[18%] translate-y-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
          <label htmlFor="command-palette-input" className="sr-only">Buscar en TRAZA</label>
          <input
            id="command-palette-input"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar en TRAZA..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border-strong)] rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto thin-scroll py-1.5">
          {query.trim().length < 2 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Buscá activos, vehículos, proveedores, conductores y traslados.
            </p>
          ) : pending ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Buscando…</p>
          ) : effectiveResults.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Sin resultados para &ldquo;{query}&rdquo;.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="px-2 py-1">
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {group}
                </p>
                {items.map((item) => {
                  flatIndex += 1;
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => goTo(item)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-[var(--brand-soft)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      )}
                    >
                      <span className="min-w-0 truncate">{item.title}</span>
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">{item.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Navegar</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Abrir</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Botón trigger para el topbar -- misma acción que Ctrl+K, para quien
// prefiera hacer click.
export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
      className="hidden md:flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 h-8 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors w-full max-w-xs"
      aria-label="Abrir buscador global"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left truncate">Buscar en TRAZA...</span>
      <kbd className="text-[10px] font-medium border border-[var(--border-strong)] rounded px-1.5 py-0.5 shrink-0">Ctrl K</kbd>
    </button>
  );
}
