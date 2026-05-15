"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import type { AiFormResponse, Angle } from "@/lib/ai/schemas";
import type { FormBuilderState } from "../types";
import type { AiAssistantState, ChatMessage, AiPhase } from "./types";

const DB_DEBOUNCE_MS = 500;

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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<AiAssistantState>(() => ({
    phase: "wizard",
    wizard: {
      step: 1,
      businessName: initialBusinessName,
      businessType: initialBusinessType,
      businessDescription: "",
      proposedAngles: [],
      selectedAngleIds: [],
      anglesLoading: false,
    },
    chatMessages: [],
    currentForm: null,
    conversationId: null,
    formId,
    isGenerating: false,
    isSending: false,
    isAnalyzing: false,
    error: null,
  }));

  const patchConversation = useCallback(
    (patch: Record<string, unknown>) => {
      const fId = formIdRef.current;
      if (!fId) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        void fetch("/api/ai/conversation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId: fId, ...patch }),
        }).catch(() => {});
      }, DB_DEBOUNCE_MS);
    },
    []
  );

  useEffect(() => {
    const fId = formIdRef.current;
    if (!fId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/ai/conversation?formId=${encodeURIComponent(fId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const { conversation } = await res.json();
        if (!conversation || cancelled) return;
        setState((prev) => {
          const ctx = (conversation.businessContext ?? {}) as {
            businessName?: string;
            businessType?: string;
            description?: string;
          };
          const proposed = (conversation.proposedAngles ?? []) as Angle[];
          const selected = (conversation.selectedAngles ?? []) as Angle[];
          const generated = conversation.generatedForm as
            | AiFormResponse
            | null;
          const dbMessages = (conversation.messages ?? []) as Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
            suggestions: string[] | null;
          }>;

          let step: 1 | 2 | 3 = 1;
          let phase: AiPhase = conversation.phase as AiPhase;
          if (phase === "angles") step = 2;
          if (phase === "chat" || phase === "validated") step = 3;

          return {
            ...prev,
            phase,
            conversationId: conversation.id,
            wizard: {
              ...prev.wizard,
              step,
              businessName:
                ctx.businessName ?? prev.wizard.businessName,
              businessType:
                ctx.businessType ?? prev.wizard.businessType,
              businessDescription:
                ctx.description ?? prev.wizard.businessDescription,
              proposedAngles: proposed,
              selectedAngleIds: selected.map((a) => a.id),
            },
            chatMessages: dbMessages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              suggestions: m.suggestions ?? undefined,
            })),
            currentForm: generated,
          };
        });
      } catch {
        // hydration failure is non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const analyzeBusiness = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      wizard: { ...prev.wizard, step: 2, anglesLoading: true },
    }));

    try {
      const res = await fetch("/api/ai/analyze-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: formIdRef.current,
          businessName: state.wizard.businessName,
          businessType: state.wizard.businessType,
          description: state.wizard.businessDescription || undefined,
          locale: userLocale,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "AI_LIMIT_REACHED") {
          setState((prev) => ({
            ...prev,
            isAnalyzing: false,
            error: "AI_LIMIT_REACHED",
            wizard: { ...prev.wizard, anglesLoading: false },
          }));
          return;
        }
        throw new Error(data.error || "Analyze failed");
      }

      const data: {
        formId: string;
        conversationId: string;
        angles: Angle[];
      } = await res.json();

      formIdRef.current = data.formId;

      setState((prev) => ({
        ...prev,
        phase: "angles",
        formId: data.formId,
        conversationId: data.conversationId,
        wizard: {
          ...prev.wizard,
          step: 2,
          anglesLoading: false,
          proposedAngles: data.angles,
          selectedAngleIds: [],
        },
        isAnalyzing: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: "ANALYZE_FAILED",
        wizard: { ...prev.wizard, anglesLoading: false },
      }));
    }
  }, [state.wizard.businessName, state.wizard.businessType, state.wizard.businessDescription, userLocale]);

  const toggleAngle = useCallback(
    (id: string) => {
      setState((prev) => {
        const current = prev.wizard.selectedAngleIds;
        let next: string[];
        if (current.includes(id)) {
          next = current.filter((x) => x !== id);
        } else {
          if (current.length >= 5) return prev;
          next = [...current, id];
        }
        return {
          ...prev,
          wizard: { ...prev.wizard, selectedAngleIds: next },
        };
      });
    },
    []
  );

  const generate = useCallback(async () => {
    const selected = state.wizard.proposedAngles.filter((a) =>
      state.wizard.selectedAngleIds.includes(a.id)
    );
    if (selected.length < 3) return;

    const fId = formIdRef.current;
    if (!fId) {
      setState((prev) => ({ ...prev, error: "GENERATION_FAILED" }));
      return;
    }

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
          formId: fId,
          selectedAngles: selected,
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
  }, [state.wizard.proposedAngles, state.wizard.selectedAngleIds, onFormGenerated]);

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
        const suggestions: string[] = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];

        const assistantMsg: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: data.message,
          suggestions,
        };

        const updatedAiForm: AiFormResponse = data.form;
        const builderForm = aiFormToBuilderState(updatedAiForm);

        setState((prev) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, assistantMsg],
          currentForm: updatedAiForm,
          isSending: false,
        }));

        const convId = state.conversationId;
        if (convId) {
          void fetch(`/api/ai/conversation/${convId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "user", content: userMsg.content },
                {
                  role: "assistant",
                  content: assistantMsg.content,
                  suggestions,
                },
              ],
            }),
          }).catch(() => {});
        }
        patchConversation({ generatedForm: updatedAiForm });

        onFormUpdated(builderForm);
      } catch {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: "REFINE_FAILED",
        }));
      }
    },
    [
      state.currentForm,
      state.chatMessages,
      state.conversationId,
      userLocale,
      onFormUpdated,
      patchConversation,
    ]
  );

  const validate = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "validated" }));
    patchConversation({ phase: "validated" });
  }, [patchConversation]);

  const applyToBuilder = useCallback(() => {
    if (!state.currentForm) return;
    const builderForm = aiFormToBuilderState(state.currentForm);
    onFormUpdated(builderForm);
  }, [state.currentForm, onFormUpdated]);

  return {
    state,
    updateWizard,
    goToStep,
    analyzeBusiness,
    toggleAngle,
    generate,
    sendMessage,
    validate,
    applyToBuilder,
    aiFormToBuilderState,
    builderStateToAiForm,
  };
}
