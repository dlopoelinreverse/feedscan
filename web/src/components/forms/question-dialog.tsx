"use client";

import { useState } from "react";
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
import type { QuestionType, QuestionState } from "./types";

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

  const [label, setLabel] = useState(editing?.label ?? "");
  const [required, setRequired] = useState(editing?.required ?? true);
  const [emojiLevels, setEmojiLevels] = useState(editing?.emojiLevels ?? 5);
  const [multipleChoice, setMultipleChoice] = useState(
    editing?.multipleChoice ?? false
  );
  const [options, setOptions] = useState<string[]>(
    editing?.options ?? (type === "CHOICE" ? [""] : [])
  );
  const [placeholder, setPlaceholder] = useState(editing?.placeholder ?? "");

  const handleSave = () => {
    if (!label.trim()) return;
    const filteredOptions = options.filter((o) => o.trim() !== "");

    onSave({
      clientId: editing?.clientId ?? nanoid(),
      id: editing?.id,
      type,
      label: label.trim(),
      options: filteredOptions,
      order: editing?.order ?? nextOrder,
      required,
      hasBranching: editing?.hasBranching ?? false,
      emojiLevels: type === "EMOJI" ? emojiLevels : undefined,
      multipleChoice: type === "CHOICE" ? multipleChoice : undefined,
      placeholder: type === "TEXT" ? placeholder : undefined,
      followUpRules: editing?.followUpRules ?? [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("questionLabel") : t("addQuestion")} —{" "}
            {t(`questionTypes.${type.toLowerCase()}` as "questionTypes.stars" | "questionTypes.emoji" | "questionTypes.choice" | "questionTypes.text")}
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
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
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
                  {options.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setOptions(options.filter((_, j) => j !== i))
                      }
                    >
                      &times;
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions([...options, ""])}
              >
                {t("addOption")}
              </Button>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={multipleChoice}
                  onCheckedChange={setMultipleChoice}
                />
                <Label className="text-sm">
                  {multipleChoice ? t("multipleChoice") : t("singleChoice")}
                </Label>
              </div>
            </div>
          )}

          {/* Text placeholder */}
          {type === "TEXT" && (
            <div className="space-y-2">
              <Label>Placeholder ({t("required" as never) ? "optionnel" : "optional"})</Label>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Votre avis..."
              />
            </div>
          )}

          {/* Required switch */}
          <div className="flex items-center gap-2">
            <Switch checked={required} onCheckedChange={setRequired} />
            <Label className="text-sm">{t("required")}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel" as never) || "Annuler"}
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {t("save" as never) || "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
