"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  canHaveBranching,
  defaultFollowUpRules,
  defaultQuestionLabel,
  defaultQuestionPlaceholder,
  defaultRequired,
  type FollowUpRuleState,
  type QuestionState,
  type QuestionType,
} from "./types";

interface QuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (question: QuestionState) => void;
  type: QuestionType;
  editing?: QuestionState;
  nextOrder: number;
}

export function QuestionDialog({
  open,
  onClose,
  onSave,
  type,
  editing,
  nextOrder,
}: QuestionDialogProps) {
  const t = useTranslations("forms");
  const tCommon = useTranslations("common");
  const tBranch = useTranslations("forms.branching");

  const [label, setLabel] = useState("");
  const [required, setRequired] = useState(true);
  const [emojiLevels, setEmojiLevels] = useState<number>(5);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [placeholder, setPlaceholder] = useState("");
  const [hasBranching, setHasBranching] = useState(false);
  const [followUpRules, setFollowUpRules] = useState<FollowUpRuleState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Re-init state when the dialog opens for a new question or editing
  useEffect(() => {
    if (!open) return;

    if (editing) {
      setLabel(editing.label);
      setRequired(editing.required);
      setEmojiLevels(editing.emojiLevels ?? 5);
      setMultipleChoice(editing.multipleChoice ?? false);
      setOptions(
        editing.options.length > 0
          ? [...editing.options]
          : type === "CHOICE"
            ? ["", ""]
            : []
      );
      setPlaceholder(editing.placeholder ?? "");
      setHasBranching(editing.hasBranching);
      setFollowUpRules(
        editing.followUpRules.length > 0
          ? editing.followUpRules.map((r) => ({ ...r }))
          : defaultFollowUpRules(type, editing.emojiLevels)
      );
    } else {
      setLabel(defaultQuestionLabel(type));
      setRequired(defaultRequired(type));
      setEmojiLevels(5);
      setMultipleChoice(false);
      setOptions(type === "CHOICE" ? ["", ""] : []);
      setPlaceholder(defaultQuestionPlaceholder(type));
      setHasBranching(false);
      setFollowUpRules(defaultFollowUpRules(type));
    }
    setError(null);
  }, [open, editing, type]);

  // When emoji levels change, reset the branching rule ranges to sensible defaults
  useEffect(() => {
    if (type === "EMOJI" && hasBranching) {
      setFollowUpRules((prev) =>
        defaultFollowUpRules("EMOJI", emojiLevels).map((defRule) => {
          const existing = prev.find(
            (r) => r.triggerType === defRule.triggerType
          );
          return existing
            ? {
                ...defRule,
                followUpLabel: existing.followUpLabel,
                followUpOptions: existing.followUpOptions,
                allowFreeText: existing.allowFreeText,
              }
            : defRule;
        })
      );
    }
  }, [emojiLevels, type, hasBranching]);

  const handleSave = () => {
    if (!label.trim()) {
      setError(t("validation.labelRequired"));
      return;
    }
    if (type === "CHOICE") {
      const filtered = options.map((o) => o.trim()).filter((o) => o !== "");
      if (filtered.length < 2) {
        setError(t("validation.minTwoOptions"));
        return;
      }
    }

    const filteredOptions =
      type === "CHOICE"
        ? options.map((o) => o.trim()).filter((o) => o !== "")
        : [];

    const finalRules =
      canHaveBranching(type) && hasBranching
        ? followUpRules.map((r) => ({
            ...r,
            followUpOptions: r.followUpOptions.filter((o) => o.trim() !== ""),
          }))
        : [];

    onSave({
      clientId: editing?.clientId ?? nanoid(),
      id: editing?.id,
      type,
      label: label.trim(),
      options: filteredOptions,
      order: editing?.order ?? nextOrder,
      required,
      hasBranching: canHaveBranching(type) && hasBranching,
      emojiLevels: type === "EMOJI" ? emojiLevels : undefined,
      multipleChoice: type === "CHOICE" ? multipleChoice : undefined,
      placeholder: type === "TEXT" ? placeholder : undefined,
      followUpRules: finalRules,
    });
    onClose();
  };

  const updateRule = (
    triggerType: "LOW" | "HIGH",
    patch: Partial<FollowUpRuleState>
  ) => {
    setFollowUpRules((prev) => {
      const idx = prev.findIndex((r) => r.triggerType === triggerType);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? t("dialog.editQuestionTitle")
              : t("dialog.addQuestionTitle")}{" "}
            —{" "}
            {t(
              `questionTypes.${type.toLowerCase()}` as
                | "questionTypes.stars"
                | "questionTypes.emoji"
                | "questionTypes.choice"
                | "questionTypes.text"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Label */}
          <div className="space-y-2">
            <Label>{t("questionLabel")}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("questionLabelPlaceholder")}
            />
          </div>

          {/* Emoji levels */}
          {type === "EMOJI" && (
            <div className="space-y-2">
              <Label>{t("emojiLevels")}</Label>
              <Select
                value={String(emojiLevels)}
                onValueChange={(v) => setEmojiLevels(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{"3 (😞 😐 😊)"}</SelectItem>
                  <SelectItem value="5">{"5 (😠 😐 🙂 😄 🤩)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Choice options */}
          {type === "CHOICE" && (
            <div className="space-y-2">
              <Label>{t("options")}</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={options.length <= 2}
                    onClick={() =>
                      setOptions(options.filter((_, j) => j !== i))
                    }
                  >
                    &times;
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions([...options, ""])}
              >
                + {t("addOption")}
              </Button>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={multipleChoice}
                  onCheckedChange={setMultipleChoice}
                />
                <Label className="text-sm cursor-pointer">
                  {t("dialog.allowMultiple")}
                </Label>
              </div>
            </div>
          )}

          {/* Text placeholder */}
          {type === "TEXT" && (
            <div className="space-y-2">
              <Label>{t("dialog.placeholderLabel")}</Label>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder={t("dialog.placeholderInputPlaceholder")}
              />
            </div>
          )}

          {/* Required switch */}
          <div className="flex items-center gap-2">
            <Switch checked={required} onCheckedChange={setRequired} />
            <Label className="text-sm cursor-pointer">{t("required")}</Label>
          </div>

          {/* Branching — only for STARS and EMOJI */}
          {canHaveBranching(type) && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={hasBranching}
                  onCheckedChange={(v) => {
                    setHasBranching(v);
                    if (v && followUpRules.length === 0) {
                      setFollowUpRules(defaultFollowUpRules(type, emojiLevels));
                    }
                  }}
                />
                <Label className="text-sm font-medium cursor-pointer">
                  {t("dialog.addBranching")}
                </Label>
              </div>

              {hasBranching && (
                <div className="border-l-4 border-[#6C5CE7] bg-muted/50 rounded-r-lg p-4 space-y-4">
                  <RuleEditor
                    rule={followUpRules.find((r) => r.triggerType === "LOW")!}
                    variant="low"
                    type={type}
                    emojiLevels={emojiLevels}
                    onChange={(patch) => updateRule("LOW", patch)}
                  />
                  <RuleEditor
                    rule={followUpRules.find((r) => r.triggerType === "HIGH")!}
                    variant="high"
                    type={type}
                    emojiLevels={emojiLevels}
                    onChange={(patch) => updateRule("HIGH", patch)}
                  />
                  <p className="text-xs text-muted-foreground italic">
                    &#8505; {tBranch("neutralNote")}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleSave}>
            {editing ? tCommon("save") : t("dialog.addButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleEditor({
  rule,
  variant,
  type,
  emojiLevels,
  onChange,
}: {
  rule: FollowUpRuleState;
  variant: "low" | "high";
  type: QuestionType;
  emojiLevels: number;
  onChange: (patch: Partial<FollowUpRuleState>) => void;
}) {
  const t = useTranslations("forms.branching");

  const badgeBg =
    variant === "low"
      ? "bg-red-50 text-red-800 border border-red-200"
      : "bg-green-50 text-green-800 border border-green-200";
  const icon = variant === "low" ? "\uD83D\uDD34" : "\uD83D\uDFE2";

  const maxScale = type === "STARS" ? 5 : emojiLevels;
  const unit = type === "STARS" ? "\u2605" : getEmojiForLevel(emojiLevels);

  const setMin = (v: number) => {
    const clamped = Math.max(1, Math.min(maxScale, v));
    const newMax = Math.max(clamped, rule.triggerMax);
    onChange({ triggerMin: clamped, triggerMax: Math.min(newMax, maxScale) });
  };
  const setMax = (v: number) => {
    const clamped = Math.max(1, Math.min(maxScale, v));
    const newMin = Math.min(clamped, rule.triggerMin);
    onChange({ triggerMax: clamped, triggerMin: Math.max(newMin, 1) });
  };

  const addOption = () => {
    const val = prompt("Option");
    if (val?.trim()) {
      onChange({ followUpOptions: [...rule.followUpOptions, val.trim()] });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">
          {icon} {variant === "low" ? t("lowScore") : t("highScore")}
        </span>
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeBg}`}
        >
          <span>{t("ifScore")}</span>
          <Input
            type="number"
            min={1}
            max={maxScale}
            value={rule.triggerMin}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-10 h-6 text-xs p-1 border-0 bg-white/60 text-center"
          />
          <span>{t("and")}</span>
          <Input
            type="number"
            min={1}
            max={maxScale}
            value={rule.triggerMax}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-10 h-6 text-xs p-1 border-0 bg-white/60 text-center"
          />
          <span className="ml-0.5">{unit}</span>
        </div>
      </div>

      <Input
        value={rule.followUpLabel}
        onChange={(e) => onChange({ followUpLabel: e.target.value })}
        placeholder={
          variant === "low"
            ? "Qu'est-ce qui n'a pas \u00e9t\u00e9 \u00e0 la hauteur ?"
            : "Qu'est-ce qui vous a le plus plu ?"
        }
        className="text-sm"
      />

      {/* Option pills */}
      <div className="flex flex-wrap gap-1.5">
        {rule.followUpOptions.map((opt, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background border text-xs"
          >
            {opt}
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive ml-0.5"
              onClick={() =>
                onChange({
                  followUpOptions: rule.followUpOptions.filter(
                    (_, j) => j !== i
                  ),
                })
              }
            >
              &times;
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-[#6C5CE7] text-[#6C5CE7] text-xs hover:bg-[#EAE6FD] transition-colors"
        >
          + Ajouter
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={rule.allowFreeText}
          onCheckedChange={(v) => onChange({ allowFreeText: v })}
        />
        <Label className="text-xs cursor-pointer">{t("allowFreeText")}</Label>
      </div>
    </div>
  );
}

function getEmojiForLevel(emojiLevels: number): string {
  return emojiLevels === 3 ? "\u{1F600}" : "\u{1F604}";
}
