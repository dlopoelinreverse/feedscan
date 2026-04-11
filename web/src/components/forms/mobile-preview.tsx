"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
<<<<<<< HEAD
import type {
  FormBuilderState,
  FollowUpRuleState,
  QuestionState,
} from "./types";
=======
import type { FormBuilderState, QuestionState, PreviewLocale } from "./types";
import { bilingualText, bilingualOptions } from "./types";
>>>>>>> feat/ai-wizard-chat

const EMOJIS_5 = ["😠", "😐", "🙂", "😄", "🤩"];
const EMOJIS_3 = ["😞", "😐", "😊"];

interface MobilePreviewProps {
  form: FormBuilderState;
  previewLocale?: PreviewLocale;
  onLocaleChange?: (locale: PreviewLocale) => void;
}

<<<<<<< HEAD
type AnswerValue = number | string | string[];

export function MobilePreview({ form }: MobilePreviewProps) {
  const t = useTranslations("publicForm");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  const setAnswer = (clientId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [clientId]: value }));
  };
=======
export function MobilePreview({
  form,
  previewLocale = "fr",
  onLocaleChange,
}: MobilePreviewProps) {
  const t = useTranslations("publicForm");
  const tPreview = useTranslations("aiWizard.preview");

  const title = bilingualText(form.titleFr, form.titleEn, previewLocale) || form.title;
  const description =
    bilingualText(form.descriptionFr, form.descriptionEn, previewLocale) ||
    form.description;
>>>>>>> feat/ai-wizard-chat

  return (
    <div className="relative">
      {/* FR/EN toggle */}
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

<<<<<<< HEAD
      <div className="px-4 pb-5 space-y-4 max-h-[520px] overflow-y-auto">
        {/* Title */}
        <div>
          <h3 className="font-bold text-[16px] leading-tight">
            {form.title || "..."}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            {form.description || t("subtitle")}
          </p>
        </div>

        {/* Questions */}
        {form.questions.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-8">
            Ajoutez des questions pour voir la preview
          </p>
        )}

        {form.questions.map((q) => (
          <QuestionPreview
            key={q.clientId}
            question={q}
            value={answers[q.clientId]}
            onChange={(v) => setAnswer(q.clientId, v)}
          />
        ))}

        {/* Submit button */}
        {form.questions.length > 0 && (
          <button
            type="button"
            className="w-full py-2.5 rounded-lg bg-[#6C5CE7] text-white text-sm font-medium"
          >
            {t("submit")}
          </button>
        )}
=======
      <div className="bg-white rounded-[28px] border border-border shadow-sm w-[260px] mx-auto overflow-hidden">
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-5 space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-bold text-[16px] leading-tight">
              {title || "..."}
            </h3>
            {description ? (
              <p className="text-[11px] text-muted-foreground mt-1">
                {description}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                {t("subtitle")}
              </p>
            )}
          </div>

          {/* Questions */}
          {form.questions.map((q) => (
            <QuestionPreview
              key={q.clientId}
              question={q}
              previewLocale={previewLocale}
              missingTranslationLabel={tPreview("missingTranslation")}
            />
          ))}

          {/* Submit button */}
          {form.questions.length > 0 && (
            <button className="w-full py-2.5 rounded-lg bg-[#6C5CE7] text-white text-sm font-medium">
              {t("submit")}
            </button>
          )}
        </div>
>>>>>>> feat/ai-wizard-chat
      </div>
    </div>
  );
}

function QuestionPreview({
  question,
<<<<<<< HEAD
  value,
  onChange,
}: {
  question: QuestionState;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const matchedRule = getMatchingRule(question, value);
=======
  previewLocale,
  missingTranslationLabel,
}: {
  question: QuestionState;
  previewLocale: PreviewLocale;
  missingTranslationLabel: string;
}) {
  const tForms = useTranslations("forms");
>>>>>>> feat/ai-wizard-chat

  const label = bilingualText(question.labelFr, question.labelEn, previewLocale) || question.label;
  const options = bilingualOptions(question.optionsFr, question.optionsEn, previewLocale);
  const fallbackOptions = options.length > 0 ? options : question.options;

  // Check if translation is missing for the selected locale
  const isMissing =
    (previewLocale === "en" && !question.labelEn && question.labelFr) ||
    (previewLocale === "fr" && !question.labelFr && question.labelEn);

  return (
<<<<<<< HEAD
    <div className="space-y-2">
      <p className="text-xs font-semibold leading-snug">
        {question.label || "..."}{" "}
=======
    <div className="space-y-1.5">
      <p className={`text-xs font-semibold ${isMissing ? "text-muted-foreground italic" : ""}`}>
        {label || "..."}{" "}
>>>>>>> feat/ai-wizard-chat
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
<<<<<<< HEAD
        <ChoiceInput
          options={question.options}
          multiple={question.multipleChoice ?? false}
          value={value}
          onChange={onChange}
        />
=======
        <ChoicePreview options={fallbackOptions} />
>>>>>>> feat/ai-wizard-chat
      )}
      {question.type === "TEXT" && (
        <TextInput
          placeholder={question.placeholder || "Votre avis..."}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )}

<<<<<<< HEAD
      {/* Follow-up */}
      {matchedRule && (
        <FollowUpBlock rule={matchedRule} variant={matchedRule.triggerType} />
=======
      {question.hasBranching && (
        <span className="inline-flex items-center gap-1 text-[9px] bg-[#EAE6FD] text-[#6C5CE7] px-1.5 py-0.5 rounded-full font-medium">
          &#x26a1; {tForms("branching.toggle")}
        </span>
>>>>>>> feat/ai-wizard-chat
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
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${
            i <= value
              ? "bg-[#FEF3E2] text-[#FDCB6E]"
              : "bg-gray-100 text-gray-300 hover:bg-gray-200"
          }`}
        >
<<<<<<< HEAD
          ★
        </button>
=======
          &#x2605;
        </div>
>>>>>>> feat/ai-wizard-chat
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
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
              selected
                ? "border-2 border-[#00B894] bg-[#E1F5EE]"
                : "bg-gray-50 hover:bg-gray-100"
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
}: {
  options: string[];
  multiple: boolean;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
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
      <p className="text-[10px] text-muted-foreground italic">
        Ajoutez des options...
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
          className={`w-full text-left text-[10px] px-2.5 py-1.5 rounded-md border transition-colors ${
            isSelected(opt)
              ? "border-[#6C5CE7] bg-[#EAE6FD] text-[#6C5CE7]"
              : "border-border hover:border-[#6C5CE7]/50"
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
      className="w-full text-[10px] px-2 py-1.5 rounded-md border border-border bg-gray-50 resize-none focus:outline-none focus:border-[#6C5CE7]"
    />
  );
}

function FollowUpBlock({
  rule,
  variant,
}: {
  rule: FollowUpRuleState;
  variant: "LOW" | "HIGH";
}) {
  const borderColor =
    variant === "LOW" ? "border-red-400" : "border-green-400";
  const bgColor = variant === "LOW" ? "bg-red-50/50" : "bg-green-50/50";

  return (
    <div
      className={`mt-2 border-l-4 ${borderColor} ${bgColor} rounded-r-md p-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200`}
    >
      <p className="text-[10px] font-semibold">
        {rule.followUpLabel || "Question de suivi..."}
      </p>
      {rule.followUpOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rule.followUpOptions.map((opt, i) => (
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
          placeholder="Précisez..."
          className="w-full text-[9px] px-1.5 py-1 rounded border border-border bg-white resize-none focus:outline-none"
        />
      )}
    </div>
  );
}
