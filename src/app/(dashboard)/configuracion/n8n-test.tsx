"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function N8nTestButton() {
  const [state, setState] = useState<TestState>({ status: "idle" });

  async function handleClick() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/automatizaciones/test", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) {
        setState({ status: "success", message: body.message ?? "Conexión exitosa." });
      } else {
        setState({ status: "error", message: body?.message ?? "Error al conectar con n8n." });
      }
    } catch {
      setState({ status: "error", message: "No se pudo contactar al servidor de TRAZA." });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={handleClick} disabled={state.status === "loading"}>
        {state.status === "loading" ? "Probando..." : "Probar conexión con n8n"}
      </Button>
      {state.status === "success" && <Badge variant="success">{state.message}</Badge>}
      {state.status === "error" && <Badge variant="danger">{state.message}</Badge>}
    </div>
  );
}
