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
  onApplyToBuilder: () => void;
  assistant: ReturnType<typeof useAiAssistant>;
}

export function AiAssistant({
  currentForm,
  onApplyToBuilder,
  assistant,
}: AiAssistantProps) {
  const t = useTranslations("aiWizard");
  const tTypes = useTranslations("onboarding.types");
  const locale = useLocale();

  const {
    state,
    updateWizard,
    goToStep,
    analyzeBusiness,
    toggleAngle,
    generate,
    sendMessage,
    validate,
  } = assistant;

  if (state.isHydrating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-10 h-10 border-4 border-[#EAE6FD] border-t-[#6C5CE7] rounded-full animate-spin mb-6" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {t("chat.restoring")}
        </p>
      </div>
    );
  }

  const inWizard = state.phase === "wizard" || state.phase === "angles";

  if (inWizard) {
    return (
      <div className="flex flex-col h-full">
        <ProgressDots currentStep={state.wizard.step} />

        {state.wizard.step === 1 && (
          <StepBusinessInfo
            state={state}
            updateWizard={updateWizard}
            analyzeBusiness={analyzeBusiness}
            t={t}
            tTypes={tTypes}
          />
        )}
        {state.wizard.step === 2 && (
          <StepAngleSelection
            state={state}
            toggleAngle={toggleAngle}
            goToStep={goToStep}
            generate={generate}
            analyzeBusiness={analyzeBusiness}
            t={t}
            locale={locale}
          />
        )}
        {state.wizard.step === 3 && (
          <StepGenerating state={state} generate={generate} t={t} />
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
            {step < currentStep ? "✓" : step}
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

function StepBusinessInfo({
  state,
  updateWizard,
  analyzeBusiness,
  t,
  tTypes,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  updateWizard: ReturnType<typeof useAiAssistant>["updateWizard"];
  analyzeBusiness: ReturnType<typeof useAiAssistant>["analyzeBusiness"];
  t: ReturnType<typeof useTranslations>;
  tTypes: ReturnType<typeof useTranslations>;
}) {
  const canProceed =
    state.wizard.businessName.trim().length > 0 &&
    state.wizard.businessType.length > 0 &&
    !state.isAnalyzing;

  return (
    <div className="flex-1 flex flex-col px-4 pb-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{t("step1.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("step1.subtitle")}
        </p>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium">{t("step1.businessName")}</label>
          <Input
            value={state.wizard.businessName}
            onChange={(e) => updateWizard({ businessName: e.target.value })}
            placeholder={t("step1.businessNamePlaceholder")}
            className="mt-1"
          />
        </div>

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

      <div className="flex justify-end pt-4">
        <Button
          onClick={analyzeBusiness}
          disabled={!canProceed}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
        >
          {state.isAnalyzing ? t("step1.analyzing") : t("step1.next")}
          <span className="ml-1">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}

function StepAngleSelection({
  state,
  toggleAngle,
  goToStep,
  generate,
  analyzeBusiness,
  t,
  locale,
}: {
  state: ReturnType<typeof useAiAssistant>["state"];
  toggleAngle: ReturnType<typeof useAiAssistant>["toggleAngle"];
  goToStep: ReturnType<typeof useAiAssistant>["goToStep"];
  generate: ReturnType<typeof useAiAssistant>["generate"];
  analyzeBusiness: ReturnType<typeof useAiAssistant>["analyzeBusiness"];
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const tCommon = useTranslations("common");
  const selectedCount = state.wizard.selectedAngleIds.length;
  const canProceed = selectedCount >= 3 && selectedCount <= 5;

  if (state.wizard.anglesLoading || state.isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-10 h-10 border-4 border-[#EAE6FD] border-t-[#6C5CE7] rounded-full animate-spin mb-6" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {t("step2.analyzing")}
        </p>
      </div>
    );
  }

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

  if (state.error === "ANALYZE_FAILED") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">&#x26a0;&#xfe0f;</div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("step2.error")}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => goToStep(1)}>
            {tCommon("back")}
          </Button>
          <Button onClick={analyzeBusiness} variant="outline">
            {t("step2.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 pb-4 min-h-0">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{t("step2.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("step2.subtitle")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {state.wizard.proposedAngles.map((angle) => {
          const isSelected = state.wizard.selectedAngleIds.includes(angle.id);
          const label = locale === "fr" ? angle.labelFr : angle.labelEn;
          const rationale = locale === "fr" ? angle.rationaleFr : angle.rationaleEn;
          const disabled = !isSelected && selectedCount >= 5;
          return (
            <button
              key={angle.id}
              type="button"
              onClick={() => toggleAngle(angle.id)}
              disabled={disabled}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isSelected
                  ? "bg-[#EAE6FD] border-[#6C5CE7]"
                  : disabled
                  ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                  : "bg-white border-border hover:border-[#6C5CE7]/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "bg-[#6C5CE7] border-[#6C5CE7]"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <span className="text-white text-xs leading-none">
                      &#x2713;
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? "text-[#6C5CE7]" : "text-foreground"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rationale}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-3 text-xs text-muted-foreground">
        {t("step2.selectedCount", { count: selectedCount })}
        {selectedCount > 0 && selectedCount < 3 && (
          <span className="text-orange-500 ml-2">{t("step2.minAngles")}</span>
        )}
      </div>

      <div className="flex justify-between pt-3">
        <Button variant="outline" onClick={() => goToStep(1)}>
          &larr; {tCommon("back")}
        </Button>
        <Button
          onClick={generate}
          disabled={!canProceed}
          className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
        >
          {t("step2.generate")} <span className="ml-1">&rarr;</span>
        </Button>
      </div>
    </div>
  );
}

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
      <div className="w-10 h-10 border-4 border-[#EAE6FD] border-t-[#6C5CE7] rounded-full animate-spin mb-6" />
      <p className="text-sm text-muted-foreground animate-pulse">
        {t(
          `step3.messages.${messages[messageIndex].key}` as Parameters<typeof t>[0]
        )}
      </p>
    </div>
  );
}

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasSendingRef = useRef(false);

  const initialMessage = buildInitialMessage(currentForm, t, locale);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [state.chatMessages.length, state.isSending]);

  useEffect(() => {
    if (wasSendingRef.current && !state.isSending) {
      inputRef.current?.focus();
    }
    wasSendingRef.current = state.isSending;
  }, [state.isSending]);

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

  const looksGreatLabel = t("chat.suggestions.looksGreat");
  const handleSuggestionClick = (suggestion: string) => {
    if (state.isSending) return;
    if (suggestion === looksGreatLabel) {
      validate();
      return;
    }
    sendMessage(suggestion);
  };

  const initialSuggestions = [
    t("chat.suggestions.addQuestion"),
    t("chat.suggestions.changeOrder"),
    t("chat.suggestions.looksGreat"),
  ];

  const lastMessage = state.chatMessages[state.chatMessages.length - 1];
  const showInitialSuggestions = state.chatMessages.length === 0;
  const showAssistantSuggestions =
    lastMessage?.role === "assistant" &&
    Array.isArray(lastMessage.suggestions) &&
    lastMessage.suggestions.length > 0;

  return (
    <div className="flex flex-col h-full">
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

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
            {showInitialSuggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {initialSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    disabled={state.isSending}
                    className="px-3 py-1.5 text-xs rounded-full border border-[#6C5CE7] text-[#6C5CE7] bg-white hover:bg-[#EAE6FD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {state.chatMessages.map((msg, idx) => {
          const isLast = idx === state.chatMessages.length - 1;
          const showSuggestionsForMsg =
            msg.role === "assistant" &&
            isLast &&
            Array.isArray(msg.suggestions) &&
            msg.suggestions.length > 0;
          return (
            <div key={msg.id} className="space-y-2">
              <div
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
              {showSuggestionsForMsg && showAssistantSuggestions && (
                <div className="flex flex-wrap gap-2">
                  {msg.suggestions!.map((s) => (
                    <button
                      key={`${msg.id}-${s}`}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      disabled={state.isSending}
                      className="px-3 py-1.5 text-xs rounded-full border border-[#6C5CE7] text-[#6C5CE7] bg-white hover:bg-[#EAE6FD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

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

      </div>

      {state.phase !== "validated" && (
        <div className="border-t px-4 py-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                state.currentForm
                  ? t("chat.iteratePlaceholder")
                  : t("chat.placeholder")
              }
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
