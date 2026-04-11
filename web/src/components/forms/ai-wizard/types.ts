import type { AiFormResponse } from "@/lib/ai/schemas";

export interface WizardState {
  step: 1 | 2 | 3;
  businessName: string;
  businessType: string;
  businessDescription: string;
  selectedAreas: string[];
  specificRequest: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

export type AiPhase = "wizard" | "chat" | "validated";

export interface AiAssistantState {
  phase: AiPhase;
  wizard: WizardState;
  chatMessages: ChatMessage[];
  currentForm: AiFormResponse | null;
  isGenerating: boolean;
  isSending: boolean;
  error: string | null;
}
