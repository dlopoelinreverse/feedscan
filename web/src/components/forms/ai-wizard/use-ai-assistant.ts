"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import type { AiFormResponse } from "@/lib/ai/schemas";
import type { FormBuilderState } from "../types";
import type { AiAssistantState, ChatMessage } from "./types";

const STORAGE_PREFIX = "feedscan:ai-assistant:";

function storageKey(formId: string | undefined): string {
  return `${STORAGE_PREFIX}${formId ?? "new"}`;
}

function loadPersistedState(
  formId: string | undefined
): Partial<AiAssistantState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(formId));
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AiAssistantState>;
  } catch {
    return null;
  }
}

function persistState(
  formId: string | undefined,
  state: AiAssistantState
): void {
  if (typeof window === "undefined") return;
  try {
    const { isGenerating: _g, isSending: _s, error: _e, ...durable } = state;
    void _g;
    void _s;
    void _e;
    window.sessionStorage.setItem(
      storageKey(formId),
      JSON.stringify(durable)
    );
  } catch {
    // ignore quota / serialization errors
  }
}

export function clearAiAssistantStorage(formId: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey(formId));
  } catch {
    // ignore
  }
}

export function migrateAiAssistantStorage(
  fromFormId: string | undefined,
  toFormId: string | undefined
): void {
  if (typeof window === "undefined") return;
  if (fromFormId === toFormId) return;
  try {
    const fromKey = storageKey(fromFormId);
    const data = window.sessionStorage.getItem(fromKey);
    if (data) {
      window.sessionStorage.setItem(storageKey(toFormId), data);
      window.sessionStorage.removeItem(fromKey);
    }
  } catch {
    // ignore
  }
}

function aiFormToBuilderState(ai: AiFormResponse): FormBuilderState {
  return {
    title: ai.titleFr,
    titleFr: ai.titleFr,
    titleEn: ai.titleEn,
    description: ai.descriptionFr,
    descriptionFr: ai.descriptionFr,
    descriptionEn: ai.descriptionEn,
    status: "DRAFT",
    rateLimitMode: "PER_24H",
    questions: ai.questions.map((q, i) => ({
      clientId: nanoid(),
      type: q.type.toUpperCase() as "STARS" | "EMOJI" | "CHOICE" | "TEXT",
      label: q.labelFr,
      labelFr: q.labelFr,
      labelEn: q.labelEn,
      options: q.optionsFr ?? [],
      optionsFr: q.optionsFr ?? [],
      optionsEn: q.optionsEn ?? [],
      order: i,
      required: q.required,
      hasBranching: !!q.branching,
      emojiLevels: q.emojiLevels ?? undefined,
      followUpRules: q.branching
        ? [
            {
              triggerType: "LOW" as const,
              triggerMin: q.branching.low.triggerMin,
              triggerMax: q.branching.low.triggerMax,
              followUpLabel: q.branching.low.followUpLabelFr,
              followUpLabelFr: q.branching.low.followUpLabelFr,
              followUpLabelEn: q.branching.low.followUpLabelEn,
              followUpOptions: q.branching.low.followUpOptionsFr,
              followUpOptionsFr: q.branching.low.followUpOptionsFr,
              followUpOptionsEn: q.branching.low.followUpOptionsEn,
              allowFreeText: q.branching.low.allowFreeText,
              enabled: true,
              allowOptions: true,
            },
            {
              triggerType: "HIGH" as const,
              triggerMin: q.branching.high.triggerMin,
              triggerMax: q.branching.high.triggerMax,
              followUpLabel: q.branching.high.followUpLabelFr,
              followUpLabelFr: q.branching.high.followUpLabelFr,
              followUpLabelEn: q.branching.high.followUpLabelEn,
              followUpOptions: q.branching.high.followUpOptionsFr,
              followUpOptionsFr: q.branching.high.followUpOptionsFr,
              followUpOptionsEn: q.branching.high.followUpOptionsEn,
              allowFreeText: q.branching.high.allowFreeText,
              enabled: true,
              allowOptions: true,
            },
          ]
        : [],
    })),
  };
}

function builderStateToAiForm(form: FormBuilderState): AiFormResponse {
  return {
    titleFr: form.titleFr || form.title,
    titleEn: form.titleEn || form.title,
    descriptionFr: form.descriptionFr || form.description,
    descriptionEn: form.descriptionEn || form.description,
    questions: form.questions.map((q) => ({
      type: q.type.toLowerCase() as "stars" | "emoji" | "choice" | "text",
      labelFr: q.labelFr || q.label,
      labelEn: q.labelEn || q.label,
      optionsFr: q.optionsFr?.length ? q.optionsFr : q.options.length ? q.options : null,
      optionsEn: q.optionsEn?.length ? q.optionsEn : null,
      required: q.required,
      emojiLevels: q.emojiLevels as 3 | 5 | undefined ?? null,
      branching:
        q.hasBranching && q.followUpRules.length >= 2
          ? {
              low: {
                triggerMin: q.followUpRules[0].triggerMin,
                triggerMax: q.followUpRules[0].triggerMax,
                followUpLabelFr:
                  q.followUpRules[0].followUpLabelFr ||
                  q.followUpRules[0].followUpLabel,
                followUpLabelEn:
                  q.followUpRules[0].followUpLabelEn ||
                  q.followUpRules[0].followUpLabel,
                followUpOptionsFr:
                  q.followUpRules[0].followUpOptionsFr ||
                  q.followUpRules[0].followUpOptions,
                followUpOptionsEn:
                  q.followUpRules[0].followUpOptionsEn ||
                  q.followUpRules[0].followUpOptions,
                allowFreeText: q.followUpRules[0].allowFreeText,
              },
              high: {
                triggerMin: q.followUpRules[1].triggerMin,
                triggerMax: q.followUpRules[1].triggerMax,
                followUpLabelFr:
                  q.followUpRules[1].followUpLabelFr ||
                  q.followUpRules[1].followUpLabel,
                followUpLabelEn:
                  q.followUpRules[1].followUpLabelEn ||
                  q.followUpRules[1].followUpLabel,
                followUpOptionsFr:
                  q.followUpRules[1].followUpOptionsFr ||
                  q.followUpRules[1].followUpOptions,
                followUpOptionsEn:
                  q.followUpRules[1].followUpOptionsEn ||
                  q.followUpRules[1].followUpOptions,
                allowFreeText: q.followUpRules[1].allowFreeText,
              },
            }
          : null,
    })),
  };
}

interface UseAiAssistantOptions {
  onFormGenerated: (form: FormBuilderState) => void;
  onFormUpdated: (form: FormBuilderState) => void;
  userLocale: string;
  initialBusinessName?: string;
  initialBusinessType?: string;
  /**
   * Form id used to scope persisted state in sessionStorage. Use `undefined`
   * for new (unsaved) forms — they share the "new" bucket.
   */
  formId?: string;
}

export function useAiAssistant({
  onFormGenerated,
  onFormUpdated,
  userLocale,
  initialBusinessName = "",
  initialBusinessType = "",
  formId,
}: UseAiAssistantOptions) {
  const formIdRef = useRef(formId);
  formIdRef.current = formId;

  const [state, setState] = useState<AiAssistantState>(() => {
    const defaults: AiAssistantState = {
      phase: "wizard",
      wizard: {
        step: 1,
        businessName: initialBusinessName,
        businessType: initialBusinessType,
        businessDescription: "",
        selectedAreas: [],
        specificRequest: "",
      },
      chatMessages: [],
      currentForm: null,
      isGenerating: false,
      isSending: false,
      error: null,
    };
    const saved = loadPersistedState(formId);
    if (!saved) return defaults;
    return {
      ...defaults,
      ...saved,
      wizard: { ...defaults.wizard, ...(saved.wizard ?? {}) },
      isGenerating: false,
      isSending: false,
      error: null,
    };
  });

  useEffect(() => {
    persistState(formIdRef.current, state);
  }, [state]);

  const updateWizard = useCallback(
    (patch: Partial<AiAssistantState["wizard"]>) => {
      setState((prev) => ({
        ...prev,
        wizard: { ...prev.wizard, ...patch },
      }));
    },
    []
  );

  const goToStep = useCallback((step: 1 | 2 | 3) => {
    setState((prev) => ({
      ...prev,
      wizard: { ...prev.wizard, step },
      error: null,
    }));
  }, []);

  const generate = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      wizard: { ...prev.wizard, step: 3 },
      isGenerating: true,
      error: null,
    }));

    try {
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: state.wizard.businessName,
          businessType: state.wizard.businessType,
          targetAreas: state.wizard.selectedAreas,
          description: state.wizard.businessDescription || undefined,
          specificRequest: state.wizard.specificRequest || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "AI_LIMIT_REACHED") {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: "AI_LIMIT_REACHED",
          }));
          return;
        }
        throw new Error(data.error || "Generation failed");
      }

      const aiForm: AiFormResponse = await res.json();
      const builderForm = aiFormToBuilderState(aiForm);

      setState((prev) => ({
        ...prev,
        phase: "chat",
        currentForm: aiForm,
        isGenerating: false,
        chatMessages: [],
      }));

      onFormGenerated(builderForm);
    } catch {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: "GENERATION_FAILED",
      }));
    }
  }, [state.wizard, onFormGenerated]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!state.currentForm) return;

      const userMsg: ChatMessage = {
        id: nanoid(),
        role: "user",
        content: message,
      };

      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, userMsg],
        isSending: true,
        error: null,
      }));

      try {
        // Build conversation history for API (only text content, not suggestions)
        const history = state.chatMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/refine-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentForm: state.currentForm,
            messages: history,
            userMessage: message,
            userLocale,
          }),
        });

        if (!res.ok) throw new Error("Refinement failed");

        const data = await res.json();

        const assistantMsg: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: data.message,
          suggestions: data.suggestions,
        };

        const updatedAiForm: AiFormResponse = data.form;
        const builderForm = aiFormToBuilderState(updatedAiForm);

        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMsg],
          currentForm: updatedAiForm,
          isSending: false,
        }));

        onFormUpdated(builderForm);
      } catch {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: "REFINE_FAILED",
        }));
      }
    },
    [state.currentForm, state.chatMessages, userLocale, onFormUpdated]
  );

  const validate = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "validated" }));
  }, []);

  const applyToBuilder = useCallback(() => {
    if (!state.currentForm) return;
    const builderForm = aiFormToBuilderState(state.currentForm);
    onFormUpdated(builderForm);
  }, [state.currentForm, onFormUpdated]);

  return {
    state,
    updateWizard,
    goToStep,
    generate,
    sendMessage,
    validate,
    applyToBuilder,
    aiFormToBuilderState,
    builderStateToAiForm,
  };
}
