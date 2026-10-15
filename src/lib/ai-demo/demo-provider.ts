import type { AiInsight, AiMessage, AiProvider, AiSuggestedQuestion } from "./types";

// Implementación de demostración de `AiProvider`: estática, determinística,
// sin red. Los números que usa (13 vencimientos, 8 activos, 1 mantenimiento,
// la patente AJ234RS) son los mismos que aparecen en las capturas reales del
// producto en public/landing/ -- no son datos inventados, son el mismo
// escenario demo ("Bodega San Rafael S.A.") mostrado en otras secciones.

const INSIGHTS: AiInsight[] = [
  {
    id: "vencimiento",
    severity: "critico",
    title: "Vencimiento vencido",
    detail: "La tasa municipal de AJ234RS venció hace 43 días y todavía no fue regularizada.",
  },
  {
    id: "mantenimiento",
    severity: "atencion",
    title: "Mantenimiento próximo",
    detail: "AJ234RS · Chevrolet S10 tiene un service programado en 27 días.",
  },
  {
    id: "costos",
    severity: "info",
    title: "Variación de costos",
    detail: "Revisá la evolución mensual de combustible y gastos en el módulo de Costos.",
  },
];

const SUGGESTED_QUESTIONS: AiSuggestedQuestion[] = [
  { id: "atencion-hoy", question: "¿Qué necesita atención hoy?" },
  { id: "proximos-vencimientos", question: "Mostrame los próximos vencimientos." },
  { id: "vehiculo-gastos", question: "¿Qué vehículo tuvo más gastos?" },
  { id: "mantenimientos-pendientes", question: "¿Qué mantenimientos están pendientes?" },
];

const RESPUESTAS: { match: RegExp; answer: string }[] = [
  {
    match: /atenci[oó]n/i,
    answer:
      "Hoy hay 13 elementos que requieren atención: activos, documentación e impuestos vencidos o por vencer. Podés verlos ordenados por urgencia en el Centro de Vencimientos.",
  },
  {
    match: /vencimient/i,
    answer:
      "Tenés 13 vencimientos activos y 2 más dentro de los próximos 30 días. El más urgente es la patente de AJ234RS.",
  },
  {
    match: /gast|costo/i,
    answer:
      "Esa vista está en el módulo de Costos, filtrando por vehículo: ahí vas a ver el gasto acumulado real de cada uno, no un promedio estimado.",
  },
  {
    match: /mantenimient/i,
    answer: "Tenés 1 mantenimiento que requiere atención: el service de AJ234RS, programado en 27 días.",
  },
];

const RESPUESTA_DEFAULT =
  "Puedo ayudarte a priorizar vencimientos, mantenimiento y costos. Probá con una de las preguntas sugeridas, o explorá el Centro de Vencimientos para el detalle completo.";

export const demoAiProvider: AiProvider = {
  getInsights() {
    return INSIGHTS;
  },
  getSuggestedQuestions() {
    return SUGGESTED_QUESTIONS;
  },
  ask(question: string): AiMessage {
    const encontrada = RESPUESTAS.find((r) => r.match.test(question));
    return { role: "assistant", content: encontrada?.answer ?? RESPUESTA_DEFAULT };
  },
};
