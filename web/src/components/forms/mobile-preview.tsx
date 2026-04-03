"use client";

import { useTranslations } from "next-intl";
import type { FormBuilderState, QuestionState } from "./types";

const EMOJIS_5 = ["\ud83d\ude20", "\ud83d\ude1f", "\ud83d\ude42", "\ud83d\ude04", "\ud83e\udd29"];
const EMOJIS_3 = ["\ud83d\ude1e", "\ud83d\ude42", "\ud83d\ude04"];

interface MobilePreviewProps {
  form: FormBuilderState;
}

export function MobilePreview({ form }: MobilePreviewProps) {
  const t = useTranslations("publicForm");

  return (
    <div className="bg-white rounded-[28px] border border-border shadow-sm w-[260px] mx-auto overflow-hidden">
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 pb-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-bold text-[16px] leading-tight">
            {form.title || "..."}
          </h3>
          {form.description && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {form.description}
            </p>
          )}
          {!form.description && (
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          )}
        </div>

        {/* Questions */}
        {form.questions.map((q) => (
          <QuestionPreview key={q.clientId} question={q} />
        ))}

        {/* Submit button */}
        {form.questions.length > 0 && (
          <button className="w-full py-2.5 rounded-lg bg-[#6C5CE7] text-white text-sm font-medium">
            {t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionPreview({ question }: { question: QuestionState }) {
  const tForms = useTranslations("forms");

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold">
        {question.label || "..."}{" "}
        {question.required && <span className="text-red-500">*</span>}
      </p>

      {question.type === "STARS" && <StarsPreview />}
      {question.type === "EMOJI" && (
        <EmojiPreview levels={question.emojiLevels ?? 5} />
      )}
      {question.type === "CHOICE" && (
        <ChoicePreview options={question.options} />
      )}
      {question.type === "TEXT" && (
        <div className="rounded-md border border-border bg-gray-50 p-2">
          <p className="text-[10px] text-muted-foreground">
            {question.placeholder || "Votre avis..."}
          </p>
        </div>
      )}

      {question.hasBranching && (
        <span className="inline-flex items-center gap-1 text-[9px] bg-[#EAE6FD] text-[#6C5CE7] px-1.5 py-0.5 rounded-full font-medium">
          ⚡ {tForms("branching.toggle")}
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
          ★
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
