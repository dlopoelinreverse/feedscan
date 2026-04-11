"use client";

import { useTranslations } from "next-intl";
import type { FormBuilderState, QuestionState, PreviewLocale } from "./types";
import { bilingualText, bilingualOptions } from "./types";

const EMOJIS_5 = ["\ud83d\ude20", "\ud83d\ude1f", "\ud83d\ude42", "\ud83d\ude04", "\ud83e\udd29"];
const EMOJIS_3 = ["\ud83d\ude1e", "\ud83d\ude42", "\ud83d\ude04"];

interface MobilePreviewProps {
  form: FormBuilderState;
  previewLocale?: PreviewLocale;
  onLocaleChange?: (locale: PreviewLocale) => void;
}

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
      </div>
    </div>
  );
}

function QuestionPreview({
  question,
  previewLocale,
  missingTranslationLabel,
}: {
  question: QuestionState;
  previewLocale: PreviewLocale;
  missingTranslationLabel: string;
}) {
  const tForms = useTranslations("forms");

  const label = bilingualText(question.labelFr, question.labelEn, previewLocale) || question.label;
  const options = bilingualOptions(question.optionsFr, question.optionsEn, previewLocale);
  const fallbackOptions = options.length > 0 ? options : question.options;

  // Check if translation is missing for the selected locale
  const isMissing =
    (previewLocale === "en" && !question.labelEn && question.labelFr) ||
    (previewLocale === "fr" && !question.labelFr && question.labelEn);

  return (
    <div className="space-y-1.5">
      <p className={`text-xs font-semibold ${isMissing ? "text-muted-foreground italic" : ""}`}>
        {label || "..."}{" "}
        {question.required && <span className="text-red-500">*</span>}
        {isMissing && (
          <span className="text-[9px] font-normal text-orange-400 ml-1">
            {missingTranslationLabel}
          </span>
        )}
      </p>

      {question.type === "STARS" && <StarsPreview />}
      {question.type === "EMOJI" && (
        <EmojiPreview levels={question.emojiLevels ?? 5} />
      )}
      {question.type === "CHOICE" && (
        <ChoicePreview options={fallbackOptions} />
      )}
      {question.type === "TEXT" && (
        <div className="rounded-md border border-border bg-gray-50 p-2">
          <p className="text-[10px] text-muted-foreground">
            {question.placeholder || tForms("dialog.placeholderInputPlaceholder")}
          </p>
        </div>
      )}

      {question.hasBranching && (
        <span className="inline-flex items-center gap-1 text-[9px] bg-[#EAE6FD] text-[#6C5CE7] px-1.5 py-0.5 rounded-full font-medium">
          &#x26a1; {tForms("branching.toggle")}
        </span>
      )}
    </div>
  );
}

function StarsPreview() {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            i <= 4
              ? "bg-[#FEF3E2] text-[#FDCB6E]"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          &#x2605;
        </div>
      ))}
    </div>
  );
}

function EmojiPreview({ levels }: { levels: number }) {
  const emojis = levels === 3 ? EMOJIS_3 : EMOJIS_5;
  return (
    <div className="flex gap-1">
      {emojis.map((emoji, i) => (
        <div
          key={i}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
            i === Math.floor(emojis.length / 2)
              ? "border-2 border-[#00B894] bg-[#E1F5EE]"
              : "bg-gray-50"
          }`}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

function ChoicePreview({ options }: { options: string[] }) {
  if (options.length === 0) return null;
  return (
    <div className="space-y-1">
      {options.map((opt, i) => (
        <div
          key={i}
          className={`text-[10px] px-2.5 py-1.5 rounded-md border ${
            i === 0
              ? "border-[#6C5CE7] bg-[#EAE6FD] text-[#6C5CE7]"
              : "border-border text-foreground"
          }`}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}
