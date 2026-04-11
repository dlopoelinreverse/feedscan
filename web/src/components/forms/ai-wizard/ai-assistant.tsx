"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormBuilderState } from "../types";
import { useAiAssistant } from "./use-ai-assistant";

const BUSINESS_TYPES = [
  "restaurant",
  "cafe",
  "salon",
  "clinique",
  "gym",
  "coworking",
  "autre",
] as const;

interface AiAssistantProps {
  currentForm: FormBuilderState;
  onFormGenerated: (form: FormBuilderState) => void;
  onFormUpdated: (form: FormBuilderState) => void;
  onApplyToBuilder: () => void;
  userProfile?: {
    businessName?: string | null;
    businessType?: string | null;
  };
}

export function AiAssistant({
  currentForm,
  onFormGenerated,
  onFormUpdated,
  onApplyToBuilder,
  userProfile,
}: AiAssistantProps) {
  const t = useTranslations("aiWizard");
  const tTypes = useTranslations("onboarding.types");
  const locale = useLocale();

  const {
    state,
    updateWizard,
    goToStep,
    generate,
    sendMessage,
    validate,
  } = useAiAssistant({
    onFormGenerated,
    onFormUpdated,
    userLocale: locale,
    initialBusinessName: userProfile?.businessName || "",
    initialBusinessType: userProfile?.businessType || "",
  });

  if (state.phase === "wizard") {
    return (
      <div className="flex flex-col h-full">
        {/* Progress dots */}
        <ProgressDots currentStep={state.wizard.step} />

        {state.wizard.step === 1 && (
          <StepBusinessInfo
            state={state}
            updateWizard={updateWizard}
            goToStep={goToStep}
            t={t}
            tTypes={tTypes}
          />
        )}
        {state.wizard.step === 2 && (
          <StepMeasurement
            state={state}
            updateWizard={updateWizard}
            goToStep={goToStep}
            generate={generate}
            t={t}
          />
        )}
        {state.wizard.step === 3 && (
          <StepGenerating
            state={state}
            generate={generate}
            t={t}
          />
        )}
      </div>
    );
  }

  return (
    <ChatPanel
      state={state}
      sendMessage={sendMessage}
      validate={validate}
      onApplyToBuilder={onApplyToBuilder}
      currentForm={currentForm}
      t={t}
      locale={locale}
    />
  );
}

// --- Progress Dots ---

function ProgressDots({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4 px-6">
      {[1, 2, 3].map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step < currentStep
                ? "bg-[#6C5CE7] text-white"
                : step === currentStep
                ? "bg-[#6C5CE7] text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {step < currentStep ? "\u2713" : step}
          </div>
          {i < 2 && (
            <div
              className={`w-16 h-0.5 ${
                step < currentStep ? "bg-[#6C5CE7]" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Step 1: Business Info ---

function StepBusinessInfo({
  state,
  updateWizard,
  goToStep,
  t,
  tTypes,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  updateWizard: ReturnType<typeof useAiAssistant>["updateWizard"];
  goToStep: ReturnType<typeof useAiAssistant>["goToStep"];
  t: ReturnType<typeof useTranslations>;
  tTypes: ReturnType<typeof useTranslations>;
}) {
  const canProceed =
    state.wizard.businessName.trim().length > 0 &&
    state.wizard.businessType.length > 0;

  return (
    <div className="flex-1 flex flex-col px-4 pb-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("step1.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("step1.subtitle")}
        </p>
      </div>

      <div className="space-y-4 flex-1">
        {/* Business Name */}
        <div>
          <label className="text-sm font-medium">{t("step1.businessName")}</label>
          <Input
            value={state.wizard.businessName}
            onChange={(e) => updateWizard({ businessName: e.target.value })}
            placeholder={t("step1.businessNamePlaceholder")}
            className="mt-1"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="text-sm font-medium">{t("step1.businessType")}</label>
          <Select
            value={state.wizard.businessType}
            onValueChange={(v) => updateWizard({ businessType: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t("step1.selectType")} />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {tTypes(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description (optional) */}
        <div>
          <label className="text-sm font-medium">
            {t("step1.description")}
          </label>
          <Input
            value={state.wizard.businessDescription}
            onChange={(e) =>
              updateWizard({ businessDescription: e.target.value })
            }
            placeholder={t("step1.descriptionPlaceholder")}
            className="mt-1"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={() => goToStep(2)}
          disabled={!canProceed}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
        >
          {t("step1.businessName") && (
            <>
              Suivant <span className="ml-1">&rarr;</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Step 2: Measurement Areas ---

function StepMeasurement({
  state,
  updateWizard,
  goToStep,
  generate,
  t,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  updateWizard: ReturnType<typeof useAiAssistant>["updateWizard"];
  goToStep: ReturnType<typeof useAiAssistant>["goToStep"];
  generate: ReturnType<typeof useAiAssistant>["generate"];
  t: ReturnType<typeof useTranslations>;
}) {
  const businessType = state.wizard.businessType || "autre";

  // Get chips for this business type from translations
  const chipKeys = getChipKeys(businessType);

  const toggleArea = (area: string) => {
    const current = state.wizard.selectedAreas;
    if (current.includes(area)) {
      updateWizard({ selectedAreas: current.filter((a) => a !== area) });
    } else {
      updateWizard({ selectedAreas: [...current, area] });
    }
  };

  const canProceed = state.wizard.selectedAreas.length >= 2;

  return (
    <div className="flex-1 flex flex-col px-4 pb-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("step2.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("step2.subtitle")}
        </p>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium mb-2 block">
            {t("step2.areasToEvaluate")}
          </label>
          <div className="flex flex-wrap gap-2">
            {chipKeys.map((key) => {
              const isSelected = state.wizard.selectedAreas.includes(key);
              const chipLabel = t(`step2.chips.${businessType}.${key}` as Parameters<typeof t>[0]);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleArea(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isSelected
                      ? "bg-[#EAE6FD] border-[#6C5CE7] text-[#6C5CE7]"
                      : "bg-white border-border text-foreground hover:border-[#6C5CE7]/50"
                  }`}
                >
                  {chipLabel}
                </button>
              );
            })}
          </div>
          {state.wizard.selectedAreas.length > 0 &&
            state.wizard.selectedAreas.length < 2 && (
              <p className="text-xs text-orange-500 mt-2">
                {t("step2.minChips")}
              </p>
            )}
        </div>

        {/* Specific request */}
        <div>
          <label className="text-sm font-medium">
            {t("step2.specificRequest")}
          </label>
          <Input
            value={state.wizard.specificRequest}
            onChange={(e) =>
              updateWizard({ specificRequest: e.target.value })
            }
            placeholder={t("step2.specificRequestPlaceholder")}
            className="mt-1"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => goToStep(1)}>
          &larr; {useBackLabel()}
        </Button>
        <Button
          onClick={generate}
          disabled={!canProceed}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
        >
          Suivant <span className="ml-1">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}

function useBackLabel() {
  const t = useTranslations("common");
  return t("back");
}

function getChipKeys(businessType: string): string[] {
  const chipMap: Record<string, string[]> = {
    restaurant: [
      "foodQuality",
      "service",
      "ambiance",
      "cleanliness",
      "valueForMoney",
      "waitTime",
      "welcome",
      "menuVariety",
    ],
    cafe: [
      "coffeeQuality",
      "service",
      "ambiance",
      "cleanliness",
      "pricing",
      "waitTime",
      "pastries",
      "wifiComfort",
    ],
    salon: [
      "cutQuality",
      "welcome",
      "waitTime",
      "cleanliness",
      "valueForMoney",
      "stylistAdvice",
      "ambiance",
    ],
    clinique: [
      "welcome",
      "waitTime",
      "practitionerAttentiveness",
      "cleanliness",
      "clarityOfExplanations",
      "followUpCare",
    ],
    gym: [
      "equipment",
      "cleanliness",
      "groupClasses",
      "availability",
      "staff",
      "ambiance",
      "valueForMoney",
    ],
    coworking: [
      "wifiConnectivity",
      "comfort",
      "noiseLevel",
      "cleanliness",
      "coffeeKitchen",
      "space",
      "valueForMoney",
    ],
    autre: [
      "serviceQuality",
      "welcome",
      "cleanliness",
      "valueForMoney",
      "waitTime",
      "ambiance",
    ],
  };
  return chipMap[businessType] || chipMap.autre;
}

// --- Step 3: Generating ---

function StepGenerating({
  state,
  generate,
  t,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  generate: () => Promise<void>;
  t: ReturnType<typeof useTranslations>;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    { key: "analyzing", duration: 1000 },
    { key: "creating", duration: 2000 },
    { key: "branching", duration: 2000 },
    { key: "finalizing", duration: 1000 },
  ];

  useEffect(() => {
    if (!state.isGenerating) return;

    let elapsed = 0;
    let currentIdx = 0;

    const interval = setInterval(() => {
      elapsed += 500;
      let cumulative = 0;
      for (let i = 0; i < messages.length; i++) {
        cumulative += messages[i].duration;
        if (elapsed < cumulative) {
          currentIdx = i;
          break;
        }
        currentIdx = messages.length - 1;
      }
      setMessageIndex(currentIdx);
    }, 500);

    return () => clearInterval(interval);
  }, [state.isGenerating]);

  if (state.error === "AI_LIMIT_REACHED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">&#x1f512;</div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("chat.limitReached")}
        </p>
        <Button className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white">
          {t("chat.upgradeCta")}
        </Button>
      </div>
    );
  }

  if (state.error === "GENERATION_FAILED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">&#x26a0;&#xfe0f;</div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("step3.error")}
        </p>
        <Button onClick={generate} variant="outline">
          {t("step3.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-[#EAE6FD] border-t-[#6C5CE7] rounded-full animate-spin mb-6" />
      <p className="text-sm text-muted-foreground animate-pulse">
        {t(
          `step3.messages.${messages[messageIndex].key}` as Parameters<typeof t>[0]
        )}
      </p>
    </div>
  );
}

// --- Chat Panel ---

function ChatPanel({
  state,
  sendMessage,
  validate,
  onApplyToBuilder,
  currentForm,
  t,
  locale,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  sendMessage: (msg: string) => Promise<void>;
  validate: () => void;
  onApplyToBuilder: () => void;
  currentForm: FormBuilderState;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build initial message from form data
  const initialMessage = buildInitialMessage(currentForm, t, locale);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chatMessages.length, state.isSending]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || state.isSending) return;
    setInput("");
    sendMessage(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Check if it's the "looks great" / "c'est parfait" suggestion
    const looksGreat = t("chat.suggestions.looksGreat");
    if (suggestion === looksGreat) {
      validate();
      return;
    }
    sendMessage(suggestion);
  };

  // Get initial suggestions
  const initialSuggestions = [
    t("chat.suggestions.addQuestion"),
    t("chat.suggestions.changeOrder"),
    t("chat.suggestions.looksGreat"),
  ];

  // Determine which suggestions to show
  const lastAssistantMsg = [...state.chatMessages]
    .reverse()
    .find((m) => m.role === "assistant");
  const currentSuggestions =
    lastAssistantMsg?.suggestions || (state.chatMessages.length === 0 ? initialSuggestions : []);

  return (
    <div className="flex flex-col h-full">
      {/* Validation Banner */}
      {state.phase === "validated" && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">
            &#x2705; {t("chat.validated", { count: currentForm.questions.length })}
          </span>
          <Button
            size="sm"
            onClick={onApplyToBuilder}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
          >
            {t("chat.applyToBuilder")} &rarr;
          </Button>
        </div>
      )}

      {/* Top bar */}
      {state.phase === "chat" && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">&#x2728; {t("tabs.assistant")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={validate}
            className="text-xs border-[#6C5CE7] text-[#6C5CE7]"
          >
            {t("chat.applyToBuilder")} &#x2713;
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial AI message */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="bg-[#f0f0f0] rounded-lg rounded-tl-none p-3 max-w-[95%]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-[#6C5CE7]">
                  &#x2728; {t("chat.badge")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{initialMessage}</p>
            </div>
            {/* Initial suggestions */}
            {state.chatMessages.length === 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {initialSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="px-3 py-1.5 text-xs rounded-full border border-[#6C5CE7] text-[#6C5CE7] bg-white hover:bg-[#EAE6FD] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat messages */}
        {state.chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-[#6C5CE7] text-white rounded-tr-none"
                  : "bg-[#f0f0f0] rounded-tl-none"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-semibold text-[#6C5CE7]">
                    &#x2728; {t("chat.badge")}
                  </span>
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Suggestions after last assistant message */}
        {currentSuggestions.length > 0 && state.chatMessages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="px-3 py-1.5 text-xs rounded-full border border-[#6C5CE7] text-[#6C5CE7] bg-white hover:bg-[#EAE6FD] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {state.isSending && (
          <div className="flex gap-2">
            <div className="bg-[#f0f0f0] rounded-lg rounded-tl-none p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {state.phase !== "validated" && (
        <div className="border-t px-4 py-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder")}
              disabled={state.isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || state.isSending}
              className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
            >
              {t("chat.send")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildInitialMessage(
  form: FormBuilderState,
  t: ReturnType<typeof useTranslations>,
  locale: string
): string {
  const questions = form.questions;
  const count = questions.length;

  let msg = t("chat.formCreated", { count });
  msg += "\n\n";

  questions.forEach((q, i) => {
    const label = locale === "fr" ? (q.labelFr || q.label) : (q.labelEn || q.label);
    const index = i + 1;

    switch (q.type) {
      case "STARS":
        msg += t("chat.questionStar", { index, label }) + "\n";
        break;
      case "EMOJI":
        msg += t("chat.questionEmoji", { index, label, levels: q.emojiLevels || 5 }) + "\n";
        break;
      case "CHOICE":
        msg += t("chat.questionChoice", { index, label }) + "\n";
        break;
      case "TEXT":
        msg += t("chat.questionText", { index, label }) + "\n";
        break;
    }
  });

  const hasBranching = questions.some((q) => q.hasBranching);
  if (hasBranching) {
    msg += "\n" + t("chat.branchingNote");
  }

  return msg;
}
