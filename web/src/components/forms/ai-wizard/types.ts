import type { AiFormResponse, Angle } from "@/lib/ai/schemas";

export type WizardStep = 1 | 2 | 3;

export interface WizardState {
  step: WizardStep;
  businessName: string;
  businessType: string;
  businessDescription: string;
  proposedAngles: Angle[];
  selectedAngleIds: string[];
  anglesLoading: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

export type AiPhase = "wizard" | "angles" | "chat" | "validated";

export interface AiAssistantState {
  phase: AiPhase;
  wizard: WizardState;
  chatMessages: ChatMessage[];
  currentForm: AiFormResponse | null;
  conversationId: string | null;
  formId: string | undefined;
  isGenerating: boolean;
  isSending: boolean;
  isAnalyzing: boolean;
  isHydrating: boolean;
  error: string | null;
}
