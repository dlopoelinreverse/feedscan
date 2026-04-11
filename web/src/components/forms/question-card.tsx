"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { QUESTION_TYPE_BADGE } from "./types";
import type { QuestionState } from "./types";

interface QuestionCardProps {
  question: QuestionState;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function QuestionCard({
  question,
  index,
  onEdit,
  onDuplicate,
  onDelete,
}: QuestionCardProps) {
  const t = useTranslations("forms");
  const tCommon = useTranslations("common");
  const badge = QUESTION_TYPE_BADGE[question.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.clientId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const metaLine = buildMetaLine(question, t, tCommon);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            &#10239;&#10239;
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Q{index + 1}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}
              >
                {t(
                  `questionTypes.${question.type.toLowerCase()}` as
                    | "questionTypes.stars"
                    | "questionTypes.emoji"
                    | "questionTypes.choice"
                    | "questionTypes.text"
                )}
              </span>
            </div>
            <p className="font-semibold mt-1">{question.label}</p>
            {metaLine && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {metaLine}
              </p>
            )}
            {question.hasBranching && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] bg-[#EAE6FD] text-[#6C5CE7] px-2 py-0.5 rounded-full font-medium">
                ⚡ {t("branching.active")}
              </span>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={onEdit}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {tCommon("edit")}
              </button>
              <button
                onClick={onDuplicate}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("duplicate")}
              </button>
              <button
                onClick={onDelete}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                {tCommon("delete")}
              </button>
            </div>
          </div>
        </div>
      </div>

    </Card>
  );
}

function buildMetaLine(
  q: QuestionState,
  t: ReturnType<typeof useTranslations<"forms">>,
  tCommon: ReturnType<typeof useTranslations<"common">>
): string {
  const parts: string[] = [];

  if (q.type === "STARS") {
    parts.push("\u2605\u2605\u2605\u2605\u2605 (1-5)");
  }
  if (q.type === "EMOJI") {
    parts.push(`${q.emojiLevels ?? 5} ${t("emojiLevels").toLowerCase()}`);
  }
  if (q.type === "CHOICE" && q.options.length > 0) {
    parts.push(q.options.join(", "));
  }
  if (q.type === "TEXT") {
    parts.push(t("questionTypes.text"));
  }

  parts.push(q.required ? t("required") : tCommon("optional"));

  return parts.join(" \u2014 ");
}
