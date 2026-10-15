"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportCsvButton } from "@/components/ui/export-csv-button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  csvValue?: (row: T) => string | number;
  className?: string;
};

export type FilterOption = { label: string; value: string };

export type FilterConfig<T> = {
  key: string;
  label: string;
  options: FilterOption[];
  predicate: (row: T, value: string) => boolean;
};

export function DataTable<T>({
  data,
  columns,
  searchKeys,
  filters,
  emptyTitle = "Sin resultados",
  emptyDescription = "No hay registros que coincidan con la búsqueda.",
  rowHref,
  exportFilename,
}: {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (row: T) => string;
  filters?: FilterConfig<T>[];
  exportFilename?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  rowHref?: (row: T) => string | undefined;
}) {
  const [query, setQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({});
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const searchId = React.useId();

  const filtered = React.useMemo(() => {
    let rows = data;
    if (query.trim() && searchKeys) {
      const q = query.toLowerCase();
      rows = rows.filter((r) => searchKeys(r).toLowerCase().includes(q));
    }
    if (filters) {
      for (const f of filters) {
        const val = activeFilters[f.key];
        if (val && val !== "TODOS") {
          rows = rows.filter((r) => f.predicate(r, val));
        }
      }
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, query, activeFilters, sort, filters, columns, searchKeys]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
      {(searchKeys || filters) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          {searchKeys && (
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <label htmlFor={searchId} className="sr-only">Buscar</label>
              <Input
                id={searchId}
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          )}
          {filters?.map((f) => (
            <Select
              key={f.key}
              className="h-8 w-auto text-xs"
              value={activeFilters[f.key] ?? "TODOS"}
              onChange={(e) =>
                setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
            >
              <option value="TODOS">{f.label}: Todos</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              {filtered.length} de {data.length}
            </span>
            {exportFilename && (
              <ExportCsvButton
                data={filtered}
                filename={exportFilename}
                columns={columns.map((c) => ({
                  header: c.header || c.key,
                  value: (row: T) => (c.csvValue ? c.csvValue(row) : c.sortValue ? c.sortValue(row) : ""),
                }))}
              />
            )}
          </div>
        </div>
      )}
      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
                {columns.map((col) => {
                  const toggleSort = () =>
                    col.sortValue &&
                    setSort((prev) =>
                      prev?.key === col.key
                        ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
                        : { key: col.key, dir: "asc" }
                    );
                  return (
                    <th
                      key={col.key}
                      onClick={toggleSort}
                      tabIndex={col.sortValue ? 0 : undefined}
                      role={col.sortValue ? "button" : undefined}
                      aria-sort={
                        col.sortValue
                          ? sort?.key === col.key
                            ? sort.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      onKeyDown={(e) => {
                        if (col.sortValue && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          toggleSort();
                        }
                      }}
                      className={cn(
                        "px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap",
                        col.sortValue &&
                          "cursor-pointer select-none hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:-outline-offset-2",
                        col.className
                      )}
                    >
                      {col.header}
                      {sort?.key === col.key && (sort.dir === "asc" ? " ↑" : " ↓")}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={i}
                    onClick={() => href && (window.location.href = href)}
                    tabIndex={href ? 0 : undefined}
                    role={href ? "link" : undefined}
                    onKeyDown={(e) => {
                      if (href && e.key === "Enter") {
                        e.preventDefault();
                        window.location.href = href;
                      }
                    }}
                    className={cn(
                      "border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors",
                      href &&
                        "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)] focus-visible:-outline-offset-2"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-2.5 align-middle", col.className)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
