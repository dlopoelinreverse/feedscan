"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { QuestionState, FollowUpRuleState } from "./types";

interface BranchingPanelProps {
  question: QuestionState;
  onUpdate: (question: QuestionState) => void;
}

function getRule(
  rules: FollowUpRuleState[],
  type: "LOW" | "HIGH"
): FollowUpRuleState {
  return (
    rules.find((r) => r.triggerType === type) ?? {
      triggerType: type,
      triggerMin: type === "LOW" ? 1 : 4,
      triggerMax: type === "LOW" ? 2 : 5,
      followUpLabel: "",
      followUpOptions: [],
      allowFreeText: true,
    }
  );
}

function updateRule(
  rules: FollowUpRuleState[],
  type: "LOW" | "HIGH",
  patch: Partial<FollowUpRuleState>
): FollowUpRuleState[] {
  const existing = rules.find((r) => r.triggerType === type);
  if (existing) {
    return rules.map((r) =>
      r.triggerType === type ? { ...r, ...patch } : r
    );
  }
  return [
    ...rules,
    {
      triggerType: type,
      triggerMin: type === "LOW" ? 1 : 4,
      triggerMax: type === "LOW" ? 2 : 5,
      followUpLabel: "",
      followUpOptions: [],
      allowFreeText: true,
      ...patch,
    },
  ];
}

export function BranchingPanel({ question, onUpdate }: BranchingPanelProps) {
  const t = useTranslations("forms.branching");

  const toggleBranching = (checked: boolean) => {
    onUpdate({
      ...question,
      hasBranching: checked,
      followUpRules: checked
        ? [getRule(question.followUpRules, "LOW"), getRule(question.followUpRules, "HIGH")]
        : [],
    });
  };

  if (!question.hasBranching) {
    return (
      <div className="flex items-center gap-2 px-4 pb-3">
        <Switch checked={false} onCheckedChange={toggleBranching} />
        <span className="text-sm text-muted-foreground">{t("inactive")}</span>
      </div>
    );
  }

  const lowRule = getRule(question.followUpRules, "LOW");
  const highRule = getRule(question.followUpRules, "HIGH");

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-center gap-2">
        <Switch checked={true} onCheckedChange={toggleBranching} />
        <span className="text-sm font-medium text-[#6C5CE7]">
          {t("active")} &#9660;
        </span>
      </div>

      <div className="border-l-4 border-[#6C5CE7] bg-muted/50 rounded-r-lg p-4 space-y-5">
        {/* Low score */}
        <RuleSection
          rule={lowRule}
          variant="low"
          onChange={(patch) =>
            onUpdate({
              ...question,
              followUpRules: updateRule(question.followUpRules, "LOW", patch),
            })
          }
        />

        {/* High score */}
        <RuleSection
          rule={highRule}
          variant="high"
          onChange={(patch) =>
            onUpdate({
              ...question,
              followUpRules: updateRule(question.followUpRules, "HIGH", patch),
            })
          }
        />

        {/* Neutral note */}
        <p className="text-xs text-muted-foreground italic">
          &#8505; {t("neutralNote")}
        </p>
      </div>
    </div>
  );
}

function RuleSection({
  rule,
  variant,
  onChange,
}: {
  rule: FollowUpRuleState;
  variant: "low" | "high";
  onChange: (patch: Partial<FollowUpRuleState>) => void;
}) {
  const t = useTranslations("forms.branching");
  const tForms = useTranslations("forms");

  const badgeBg =
    variant === "low" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800";
  const icon = variant === "low" ? "\ud83d\udfe0" : "\ud83d\udfe2";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm">
          {icon} {t("ifScore")}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badgeBg}`}>
          <Input
            type="number"
            min={1}
            max={5}
            value={rule.triggerMin}
            onChange={(e) => onChange({ triggerMin: Number(e.target.value) })}
            className="w-12 h-6 text-xs p-1 border-0 bg-transparent"
          />
          {t("and")}
          <Input
            type="number"
            min={1}
            max={5}
            value={rule.triggerMax}
            onChange={(e) => onChange({ triggerMax: Number(e.target.value) })}
            className="w-12 h-6 text-xs p-1 border-0 bg-transparent"
          />
        </span>
      </div>

      <div className="pl-2 space-y-2">
        <div className="border border-dashed border-border rounded-lg p-3 space-y-3">
          <Input
            value={rule.followUpLabel}
            onChange={(e) => onChange({ followUpLabel: e.target.value })}
            placeholder={t("followUpPlaceholder")}
            className="text-sm"
          />

          {/* Options */}
          <div className="flex flex-wrap gap-1.5">
            {rule.followUpOptions.map((opt, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
              >
                {opt}
                <button
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
            <AddOptionPill
              onAdd={(val) =>
                onChange({
                  followUpOptions: [...rule.followUpOptions, val],
                })
              }
              label={tForms("addOption")}
            />
          </div>

          {/* Allow free text */}
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.allowFreeText}
              onCheckedChange={(v) => onChange({ allowFreeText: v })}
            />
            <Label className="text-xs">{t("allowFreeText")}</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddOptionPill({
  onAdd,
  label,
}: {
  onAdd: (val: string) => void;
  label: string;
}) {
  const handleClick = () => {
    const val = prompt(label);
    if (val?.trim()) {
      onAdd(val.trim());
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-[#6C5CE7] text-[#6C5CE7] text-xs hover:bg-[#EAE6FD] transition-colors"
    >
      + {label}
    </button>
  );
}
