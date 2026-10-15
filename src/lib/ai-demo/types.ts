// Contrato del "asistente TRAZA" -- hoy solo existe `demo-provider.ts` como
// implementación (estática, sin red). El día que el producto tenga un
// servicio de IA real, esa implementación satisface esta misma interfaz y
// los componentes de la landing (intelligence.tsx, assistant.tsx) no
// necesitan cambiar.

export type AiSeverity = "critico" | "atencion" | "info";

export type AiInsight = {
  id: string;
  severity: AiSeverity;
  title: string;
  detail: string;
};

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiSuggestedQuestion = {
  id: string;
  question: string;
};

export interface AiProvider {
  getInsights(): AiInsight[];
  getSuggestedQuestions(): AiSuggestedQuestion[];
  ask(question: string): AiMessage;
}
