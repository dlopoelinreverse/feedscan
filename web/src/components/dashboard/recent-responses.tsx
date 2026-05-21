"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface RecentResponseItem {
  id: string;
  formTitle: string;
  createdAt: string; // ISO
  avgScore: number;
  details: {
    questionLabel: string;
    questionType: "STARS" | "EMOJI" | "CHOICE" | "TEXT";
    answer: string;
    followUp?: { selected: string[]; freeText?: string };
  }[];
  metadata?: { device?: string; lang?: string };
}

type TimeAgoFn = (key: "seconds" | "minutes" | "hours" | "days", values: { n: number }) => string;

function timeAgo(iso: string, t: TimeAgoFn): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return t("seconds", { n: Math.floor(diff) });
  if (diff < 3600) return t("minutes", { n: Math.floor(diff / 60) });
  if (diff < 86400) return t("hours", { n: Math.floor(diff / 3600) });
  return t("days", { n: Math.floor(diff / 86400) });
}

function StarRow({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span className="text-[#FDCB6E]">
      {"★".repeat(full)}
      <span className="text-muted-foreground/40">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

function scoreColor(score: number): string {
  if (score >= 4) return "text-[#00B894]";
  if (score >= 3) return "text-[#FDCB6E]";
  return "text-[#E24B4A]";
}

export function RecentResponses({ items }: { items: RecentResponseItem[] }) {
  const t = useTranslations("dashboard");
  const tTime = useTranslations("dashboard.timeAgo");
  const [open, setOpen] = useState<RecentResponseItem | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {t("recentResponses.emptyShort")}
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(item)}
              className="w-full flex items-center justify-between py-3 text-left hover:bg-muted/40 px-2 rounded transition-colors"
            >
              <div>
                <p className="font-semibold text-sm">{item.formTitle}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt, tTime)}</p>
              </div>
              <div className="flex items-center gap-3 text-right">
                <StarRow score={item.avgScore} />
                <span className={cn("font-bold text-sm w-10", scoreColor(item.avgScore))}>
                  {item.avgScore.toFixed(1)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{open?.formTitle}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="space-y-4 mt-2">
              <p className="text-xs text-muted-foreground">
                {new Date(open.createdAt).toLocaleString()}
                {open.metadata?.device && ` · ${open.metadata.device}`}
                {open.metadata?.lang && ` · ${open.metadata.lang}`}
              </p>
              {open.details.map((d, i) => (
                <div key={i} className="border-l-2 border-[#6C5CE7] pl-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {d.questionLabel}
                  </p>
                  <p className="text-sm">{d.answer}</p>
                  {d.followUp && (
                    <div className="mt-1.5 text-xs bg-muted/50 rounded p-2">
                      {d.followUp.selected.length > 0 && (
                        <p>{t("recentResponses.reasonsPrefix")} {d.followUp.selected.join(", ")}</p>
                      )}
                      {d.followUp.freeText && (
                        <p className="italic mt-1">« {d.followUp.freeText} »</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
