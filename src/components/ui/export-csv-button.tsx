"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function ExportCsvButton<T>({
  data,
  columns,
  filename,
}: {
  data: T[];
  columns: { header: string; value: (row: T) => unknown }[];
  filename: string;
}) {
  function handleExport() {
    const header = columns.map((c) => toCsvValue(c.header)).join(";");
    const rows = data.map((row) => columns.map((c) => toCsvValue(c.value(row))).join(";"));
    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleExport} disabled={data.length === 0}>
      <Download className="h-3.5 w-3.5" /> Exportar CSV
    </Button>
  );
}
