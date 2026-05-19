"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ThankYouScreen } from "./thank-you-screen";
import { ThemedFormShell } from "./themed-form-shell";
import type {
  AnswerState,
  AnswerValue,
  PublicFollowUpRule,
  PublicFormData,
  PublicQuestion,
} from "./types";

interface PublicFormProps {
  form: PublicFormData;
  qrCodeId: string | null;
  apiBase: string;
}

const COOKIE_NAME = "fs_vid";
const SESSION_KEY_PREFIX = "fs_sess_";

export function PublicForm({ form, qrCodeId, apiBase }: PublicFormProps) {
  const t = useTranslations("publicForm");
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [identifying, setIdentifying] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const cookieId = readCookie(COOKIE_NAME);
        const fingerprintHash = await computeFingerprint();

        const res = await fetch(`${apiBase}/api/visitors`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookieId, fingerprintHash }),
        });

        if (res.ok) {
          const data = (await res.json()) as { visitorId: string };
          setVisitorId(data.visitorId);

          if (form.rateLimitMode === "PER_SESSION") {
            const key = SESSION_KEY_PREFIX + form.id;
            if (sessionStorage.getItem(key) === "1") {
              setAlreadyResponded(true);
            }
          }
        }
      } catch (err) {
        console.error("visitor identification failed", err);
      } finally {
        setIdentifying(false);
      }
    })();
  }, [apiBase, form.id, form.rateLimitMode]);

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => {
      const next = { ...prev };
      const existing = next[questionId];

      const question = form.questions.find((q) => q.id === questionId);
      let followUp: AnswerState["followUp"] = undefined;

      if (question?.hasBranching && typeof value === "number") {
        const matched = question.followUpRules.find(
          (r) => value >= r.triggerMin && value <= r.triggerMax
        );
        if (matched) {
          if (existing?.followUp?.ruleId === matched.id) {
            followUp = existing.followUp;
          } else {
            followUp = {
              ruleId: matched.id,
              selected: [],
              freeText: "",
            };
          }
        }
      }

      next[questionId] = { value, followUp };
      return next;
    });

    setErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const setFollowUpSelected = (questionId: string, selected: string[]) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current?.followUp) return prev;
      return {
        ...prev,
        [questionId]: {
          ...current,
          followUp: { ...current.followUp, selected },
        },
      };
    });
  };

  const setFollowUpText = (questionId: string, freeText: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current?.followUp) return prev;
      return {
        ...prev,
        [questionId]: {
          ...current,
          followUp: { ...current.followUp, freeText },
        },
      };
    });
  };

  const validate = (): string | null => {
    const newErrors: Record<string, string> = {};
    let firstMissing: string | null = null;

    for (const q of form.questions) {
      if (!q.required) continue;
      const answer = answers[q.id];
      const isEmpty =
        !answer ||
        answer.value === undefined ||
        answer.value === null ||
        answer.value === 0 ||
        answer.value === "" ||
        (Array.isArray(answer.value) && answer.value.length === 0);

      if (isEmpty) {
        newErrors[q.id] = t("requiredField");
        if (!firstMissing) firstMissing = q.id;
      }
    }

    setErrors(newErrors);
    return firstMissing;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorId) return;

    const firstMissing = validate();
    if (firstMissing) {
      const el = document.getElementById(`q-${firstMissing}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/responses`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          qrCodeId,
          visitorId,
          answers,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }),
      });

      if (res.status === 409) {
        setAlreadyResponded(true);
        return;
      }

      if (!res.ok) {
        throw new Error("submit failed");
      }

      if (form.rateLimitMode === "PER_SESSION") {
        sessionStorage.setItem(SESSION_KEY_PREFIX + form.id, "1");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <ThemedFormShell theme={form.theme}>
        <ThankYouScreen />
      </ThemedFormShell>
    );
  }

  if (alreadyResponded) {
    return (
      <ThemedFormShell theme={form.theme}>
        <AlreadyResponded />
      </ThemedFormShell>
    );
  }

  return (
    <ThemedFormShell theme={form.theme}>
      <div className="fs-themed w-full max-w-[480px] mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-5 h-5 rounded"
            style={{
              background: "var(--fs-primary)",
              borderRadius: "var(--fs-radius-sm)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--fs-text-muted)" }}>
            {t("viaBrand")}
          </span>
        </div>

        <h1 className="text-xl font-bold leading-tight mb-2">{form.title}</h1>
        {form.description && (
          <p
            className="text-[13px] leading-relaxed mb-6"
            style={{ color: "var(--fs-text-muted)" }}
          >
            {form.description}
          </p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((q) => (
            <QuestionBlock
              key={q.id}
              question={q}
              answer={answers[q.id]}
              error={errors[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
              onFollowUpSelectedChange={(selected) =>
                setFollowUpSelected(q.id, selected)
              }
              onFollowUpTextChange={(text) => setFollowUpText(q.id, text)}
            />
          ))}

          <button
            type="submit"
            disabled={submitting || identifying || !visitorId}
            className="fs-submit w-full py-3.5 font-medium text-[15px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? t("sending") : t("submit")}
          </button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--fs-text-muted)" }}
        >
          {t("poweredBy")}
        </p>
      </div>
    </ThemedFormShell>
  );
}

function QuestionBlock({
  question,
  answer,
  error,
  onChange,
  onFollowUpSelectedChange,
  onFollowUpTextChange,
}: {
  question: PublicQuestion;
  answer: AnswerState | undefined;
  error?: string;
  onChange: (v: AnswerValue) => void;
  onFollowUpSelectedChange: (selected: string[]) => void;
  onFollowUpTextChange: (text: string) => void;
}) {
  const matchedRule =
    answer?.followUp && question.hasBranching
      ? question.followUpRules.find((r) => r.id === answer.followUp!.ruleId)
      : null;

  return (
    <div id={`q-${question.id}`} className="space-y-3">
      <label className="block text-[15px] font-semibold leading-snug">
        {question.label}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {question.type === "STARS" && (
        <StarRating
          value={typeof answer?.value === "number" ? answer.value : 0}
          onChange={onChange}
        />
      )}
      {question.type === "EMOJI" && (
        <EmojiScale
          levels={question.emojiLevels ?? 5}
          value={typeof answer?.value === "number" ? answer.value : 0}
          onChange={onChange}
        />
      )}
      {question.type === "CHOICE" && (
        <ChoiceSelector
          options={question.options}
          multiple={question.multipleChoice ?? false}
          value={answer?.value}
          onChange={onChange}
        />
      )}
      {question.type === "TEXT" && (
        <FreeText
          placeholder={question.placeholder ?? undefined}
          value={typeof answer?.value === "string" ? answer.value : ""}
          onChange={onChange}
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {matchedRule && (
        <FollowUpBlock
          rule={matchedRule}
          selected={answer?.followUp?.selected ?? []}
          freeText={answer?.followUp?.freeText ?? ""}
          onSelectedChange={onFollowUpSelectedChange}
          onTextChange={onFollowUpTextChange}
        />
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`fs-star w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${
            i <= value ? "fs-star-on" : "fs-star-off"
          }`}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function EmojiScale({
  levels,
  value,
  onChange,
}: {
  levels: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const emojis =
    levels === 3 ? ["😞", "😐", "😊"] : ["😠", "😐", "🙂", "😄", "🤩"];

  return (
    <div className="flex gap-2">
      {emojis.map((emoji, i) => {
        const level = i + 1;
        const selected = value === level;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(level)}
            className={`fs-emoji w-12 h-12 flex items-center justify-center text-2xl transition-all active:scale-95 ${
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

function ChoiceSelector({
  options,
  multiple,
  value,
  onChange,
  compact = false,
}: {
  options: string[];
  multiple: boolean;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  compact?: boolean;
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

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(opt)}
          className={`fs-choice w-full text-left border transition-colors ${
            compact ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm"
          } ${isSelected(opt) ? "fs-choice-on" : "fs-choice-off"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function FreeText({
  placeholder,
  value,
  onChange,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("publicForm");
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || t("textPlaceholder")}
      rows={3}
      className="fs-input w-full px-4 py-3 border text-base sm:text-sm resize-y min-h-[60px] max-h-[200px] focus:outline-none"
    />
  );
}

function FollowUpBlock({
  rule,
  selected,
  freeText,
  onSelectedChange,
  onTextChange,
}: {
  rule: PublicFollowUpRule;
  selected: string[];
  freeText: string;
  onSelectedChange: (selected: string[]) => void;
  onTextChange: (text: string) => void;
}) {
  const t = useTranslations("publicForm");
  const isLow = rule.triggerType === "LOW";
  const borderColor = isLow ? "#E24B4A" : "#1D9E75";
  const bgColor = isLow ? "rgba(248, 113, 113, 0.08)" : "rgba(34, 197, 94, 0.08)";
  const badgeColor = isLow
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";

  return (
    <div
      className="mt-2 border-l-[3px] p-3 space-y-2 animate-in slide-in-from-top-1 duration-200"
      style={{
        borderLeftColor: borderColor,
        background: bgColor,
        borderTopRightRadius: "var(--fs-radius)",
        borderBottomRightRadius: "var(--fs-radius)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}
        >
          {t("followUpBadge")}
        </span>
        <p className="text-xs font-semibold">{rule.followUpLabel}</p>
      </div>

      {rule.followUpOptions.length > 0 && (
        <ChoiceSelector
          options={rule.followUpOptions}
          multiple={true}
          value={selected}
          onChange={(v) =>
            onSelectedChange(Array.isArray(v) ? v : [String(v)])
          }
          compact
        />
      )}

      {rule.allowFreeText && (
        <textarea
          value={freeText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={t("followUpPlaceholder")}
          rows={2}
          className="fs-input w-full px-2 py-1.5 border text-base sm:text-xs resize-none focus:outline-none"
          style={{ background: "var(--fs-bg)" }}
        />
      )}
    </div>
  );
}

function AlreadyResponded() {
  const t = useTranslations("publicForm");
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="text-5xl">🙏</div>
        <p className="text-lg font-semibold">{t("alreadyResponded")}</p>
        <p
          className="text-xs pt-4"
          style={{ color: "var(--fs-text-muted)" }}
        >
          {t("poweredBy")}
        </p>
      </div>
    </div>
  );
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

async function computeFingerprint(): Promise<string | null> {
  if (typeof window === "undefined" || !crypto.subtle) return null;

  try {
    const parts = [
      String(screen.width),
      String(screen.height),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
      navigator.platform,
      String(screen.colorDepth),
    ].join("|");

    const encoder = new TextEncoder();
    const data = encoder.encode(parts);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}
