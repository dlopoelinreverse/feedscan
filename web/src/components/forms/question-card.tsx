"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { BranchingPanel } from "./branching-panel";
import { QUESTION_TYPE_BADGE } from "./types";
import type { QuestionState } from "./types";

interface QuestionCardProps {
  question: QuestionState;
  index: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUpdate: (q: QuestionState) => void;
}

export function QuestionCard({
  question,
  index,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdate,
}: QuestionCardProps) {
  const t = useTranslations("forms");
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

  const metaLine = buildMetaLine(question, t);

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

            {/* Action buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={onEdit}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("common.edit" as never) || "Modifier"}
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
                {t("common.delete" as never) || "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Branching panel (only for STARS and EMOJI) */}
      {(question.type === "STARS" || question.type === "EMOJI") && (
        <BranchingPanel question={question} onUpdate={onUpdate} />
      )}
    </Card>
  );
}

function buildMetaLine(
  q: QuestionState,
  t: ReturnType<typeof useTranslations<"forms">>
): string {
  const parts: string[] = [];

  if (q.type === "STARS") {
    parts.push("\u2605\u2605\u2605\u2605\u2605 (1-5)");
  }
  if (q.type === "EMOJI") {
    parts.push(`${q.emojiLevels ?? 5} niveaux d'emoji`);
  }
  if (q.type === "CHOICE" && q.options.length > 0) {
    parts.push(q.options.join(", "));
  }
  if (q.type === "TEXT") {
    parts.push("Texte libre");
  }

  parts.push(
    q.required
      ? (t("required") || "Obligatoire")
      : (t("common.optional" as never) || "Optionnel")
  );

  return parts.join(" \u2014 ");
}
