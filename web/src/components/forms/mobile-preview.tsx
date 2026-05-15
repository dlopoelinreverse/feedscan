"use client";

import { useState } from "react";
import type {
  FormBuilderState,
  FollowUpRuleState,
  QuestionState,
  PreviewLocale,
} from "./types";
import { bilingualText, bilingualOptions } from "./types";
import { ThemedFormShell } from "@/components/public/themed-form-shell";
import { PRESETS } from "@/lib/themes/presets";
import type { ThemeConfig } from "@/lib/themes/types";

const EMOJIS_5 = ["😠", "😐", "🙂", "😄", "🤩"];
const EMOJIS_3 = ["😞", "😐", "😊"];

const PREVIEW_STRINGS = {
  fr: {
    submit: "Envoyer mon avis",
    subtitle: "Aidez-nous à améliorer votre expérience. Moins d'une minute.",
    followUpFallback: "Question de suivi...",
    specifyPlaceholder: "Précisez...",
    textPlaceholder: "Votre avis...",
    addOptionsHint: "Ajoutez des options...",
    buildingQuestions: "Les questions apparaîtront ici au fur et à mesure",
    missingTranslation: "(traduction manquante)",
  },
  en: {
    submit: "Submit my feedback",
    subtitle: "Help us improve your experience. Less than a minute.",
    followUpFallback: "Follow-up question...",
    specifyPlaceholder: "Tell us more...",
    textPlaceholder: "Your feedback...",
    addOptionsHint: "Add options...",
    buildingQuestions: "Questions will appear here as you build the form",
    missingTranslation: "(missing translation)",
  },
} as const;

function previewT(
  locale: PreviewLocale,
  key: keyof (typeof PREVIEW_STRINGS)["fr"]
): string {
  return PREVIEW_STRINGS[locale][key];
}

interface MobilePreviewProps {
  form: FormBuilderState;
  previewLocale?: PreviewLocale;
  onLocaleChange?: (locale: PreviewLocale) => void;
  theme?: ThemeConfig;
}

type AnswerValue = number | string | string[];

export function MobilePreview({
  form,
  previewLocale = "fr",
  onLocaleChange,
  theme,
}: MobilePreviewProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const activeTheme = theme ?? PRESETS.minimal;

  const setAnswer = (clientId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [clientId]: value }));
  };

  const title = bilingualText(form.titleFr, form.titleEn, previewLocale) || form.title;
  const description =
    bilingualText(form.descriptionFr, form.descriptionEn, previewLocale) ||
    form.description;

  return (
    <div className="relative">
      {onLocaleChange && (
        <div className="flex justify-center mb-2">
          <div className="inline-flex rounded-full border border-border bg-white text-xs overflow-hidden">
            <button
              type="button"
              onClick={() => onLocaleChange("fr")}
              className={`px-3 py-1 font-medium transition-colors ${
                previewLocale === "fr"
                  ? "bg-[#6C5CE7] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange("en")}
              className={`px-3 py-1 font-medium transition-colors ${
                previewLocale === "en"
                  ? "bg-[#6C5CE7] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-border shadow-sm w-[260px] mx-auto overflow-hidden bg-white">
        <ThemedFormShell theme={activeTheme} fillParent className="fs-themed">
          <div className="flex justify-center pt-3 pb-2" style={{ background: "var(--fs-bg)" }}>
            <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <div className="px-4 pb-5 space-y-4 max-h-[520px] overflow-y-auto" style={{ background: "var(--fs-bg)" }}>
            <div>
              <h3 className="font-bold text-[16px] leading-tight">
                {title || "..."}
              </h3>
              <p className="text-[11px] mt-1" style={{ color: "var(--fs-text-muted)" }}>
                {description || previewT(previewLocale, "subtitle")}
              </p>
            </div>

            {form.questions.length === 0 && (
              <p className="text-xs italic text-center py-8" style={{ color: "var(--fs-text-muted)" }}>
                {previewT(previewLocale, "buildingQuestions")}
              </p>
            )}

            {form.questions.map((q) => (
              <QuestionPreview
                key={q.clientId}
                question={q}
                value={answers[q.clientId]}
                onChange={(v) => setAnswer(q.clientId, v)}
                previewLocale={previewLocale}
                missingTranslationLabel={previewT(previewLocale, "missingTranslation")}
              />
            ))}

            {form.questions.length > 0 && (
              <button
                type="button"
                className="fs-submit w-full py-2.5 text-sm font-medium"
              >
                {previewT(previewLocale, "submit")}
              </button>
            )}
          </div>
        </ThemedFormShell>
      </div>
    </div>
  );
}

function QuestionPreview({
  question,
  value,
  onChange,
  previewLocale,
  missingTranslationLabel,
}: {
  question: QuestionState;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  previewLocale: PreviewLocale;
  missingTranslationLabel: string;
}) {
  const matchedRule = getMatchingRule(question, value);

  const label = bilingualText(question.labelFr, question.labelEn, previewLocale) || question.label;
  const options = bilingualOptions(question.optionsFr, question.optionsEn, previewLocale);
  const fallbackOptions = options.length > 0 ? options : question.options;

  const isMissing =
    (previewLocale === "en" && !question.labelEn && question.labelFr) ||
    (previewLocale === "fr" && !question.labelFr && question.labelEn);

  return (
    <div className="space-y-2">
      <p
        className={`text-xs font-semibold leading-snug ${isMissing ? "italic" : ""}`}
        style={isMissing ? { color: "var(--fs-text-muted)" } : undefined}
      >
        {label || "..."}{" "}
        {question.required && <span className="text-red-500">*</span>}
        {isMissing && (
          <span className="text-[9px] font-normal text-orange-400 ml-1">
            {missingTranslationLabel}
          </span>
        )}
      </p>

      {question.type === "STARS" && (
        <StarsInput
          value={typeof value === "number" ? value : 0}
          onChange={onChange}
        />
      )}
      {question.type === "EMOJI" && (
        <EmojiInput
          levels={question.emojiLevels ?? 5}
          value={typeof value === "number" ? value : 0}
          onChange={onChange}
        />
      )}
      {question.type === "CHOICE" && (
        <ChoiceInput
          options={fallbackOptions}
          multiple={question.multipleChoice ?? false}
          value={value}
          onChange={onChange}
          previewLocale={previewLocale}
        />
      )}
      {question.type === "TEXT" && (
        <TextInput
          placeholder={
            question.placeholder || previewT(previewLocale, "textPlaceholder")
          }
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )}

      {matchedRule && (
        <FollowUpBlock
          rule={matchedRule}
          variant={matchedRule.triggerType}
          previewLocale={previewLocale}
        />
      )}
    </div>
  );
}

function getMatchingRule(
  question: QuestionState,
  value: AnswerValue | undefined
): FollowUpRuleState | null {
  if (!question.hasBranching) return null;
  if (typeof value !== "number" || value === 0) return null;

  for (const rule of question.followUpRules) {
    if (value >= rule.triggerMin && value <= rule.triggerMax) {
      return rule;
    }
  }
  return null;
}

function StarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`fs-star w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
            i <= value ? "fs-star-on" : "fs-star-off"
          }`}
        >
          &#x2605;
        </button>
      ))}
    </div>
  );
}

function EmojiInput({
  levels,
  value,
  onChange,
}: {
  levels: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const emojis = levels === 3 ? EMOJIS_3 : EMOJIS_5;
  return (
    <div className="flex gap-1">
      {emojis.map((emoji, i) => {
        const level = i + 1;
        const selected = value === level;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(level)}
            className={`fs-emoji w-9 h-9 flex items-center justify-center text-base transition-all ${
              selected ? "fs-emoji-on" : "fs-emoji-off"
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceInput({
  options,
  multiple,
  value,
  onChange,
  previewLocale,
}: {
  options: string[];
  multiple: boolean;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  previewLocale: PreviewLocale;
}) {
  const selectedArr = Array.isArray(value) ? value : [];
  const selectedStr = typeof value === "string" ? value : "";

  const isSelected = (opt: string) =>
    multiple ? selectedArr.includes(opt) : selectedStr === opt;

  const handleClick = (opt: string) => {
    if (multiple) {
      if (selectedArr.includes(opt)) {
        onChange(selectedArr.filter((o) => o !== opt));
      } else {
        onChange([...selectedArr, opt]);
      }
    } else {
      onChange(opt);
    }
  };

  if (options.length === 0) {
    return (
      <p className="text-[10px] italic" style={{ color: "var(--fs-text-muted)" }}>
        {previewT(previewLocale, "addOptionsHint")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(opt)}
          className={`fs-choice w-full text-left text-[10px] px-2.5 py-1.5 border transition-colors ${
            isSelected(opt) ? "fs-choice-on" : "fs-choice-off"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="fs-input w-full text-[10px] px-2 py-1.5 border resize-none focus:outline-none"
    />
  );
}

function FollowUpBlock({
  rule,
  variant,
  previewLocale,
}: {
  rule: FollowUpRuleState;
  variant: "LOW" | "HIGH";
  previewLocale: PreviewLocale;
}) {
  const borderColor = variant === "LOW" ? "#E24B4A" : "#1D9E75";
  const bgColor =
    variant === "LOW" ? "rgba(248, 113, 113, 0.08)" : "rgba(34, 197, 94, 0.08)";

  const label =
    bilingualText(rule.followUpLabelFr, rule.followUpLabelEn, previewLocale) ||
    rule.followUpLabel;
  const options = bilingualOptions(
    rule.followUpOptionsFr,
    rule.followUpOptionsEn,
    previewLocale
  );
  const displayedOptions = options.length > 0 ? options : rule.followUpOptions;

  return (
    <div
      className="mt-2 border-l-4 p-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200"
      style={{
        borderLeftColor: borderColor,
        background: bgColor,
        borderTopRightRadius: "var(--fs-radius)",
        borderBottomRightRadius: "var(--fs-radius)",
      }}
    >
      <p className="text-[10px] font-semibold">
        {label || previewT(previewLocale, "followUpFallback")}
      </p>
      {displayedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayedOptions.map((opt, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-border"
            >
              {opt}
            </span>
          ))}
        </div>
      )}
      {rule.allowFreeText && (
        <textarea
          rows={1}
          placeholder={previewT(previewLocale, "specifyPlaceholder")}
          className="fs-input w-full text-[9px] px-1.5 py-1 border resize-none focus:outline-none"
        />
      )}
    </div>
  );
}
