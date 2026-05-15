"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PresetThumbnail } from "./preset-thumbnail";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { PRESETS, PRESET_ORDER } from "@/lib/themes/presets";
import type { ThemePresetId, ThemeRecord } from "@/lib/themes/types";

interface ThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themes: ThemeRecord[];
  currentThemeId: string | null;
  onApply: (themeId: string) => Promise<void> | void;
  onUsePreset: (presetId: ThemePresetId) => Promise<void> | void;
}

export function ThemeSelector(props: ThemeSelectorProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SelectorBody {...props} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-3xl">
        <SelectorBody {...props} />
      </DialogContent>
    </Dialog>
  );
}

function SelectorBody({
  themes,
  currentThemeId,
  onApply,
  onUsePreset,
  onOpenChange,
}: Omit<ThemeSelectorProps, "open">) {
  const t = useTranslations("themes");
  const [busyId, setBusyId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const Heading = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;
  const Description = isMobile ? SheetDescription : DialogDescription;

  const handleApply = async (id: string) => {
    setBusyId(id);
    try {
      await onApply(id);
      onOpenChange(false);
    } finally {
      setBusyId(null);
    }
  };

  const handlePreset = async (id: ThemePresetId) => {
    setBusyId(`preset:${id}`);
    try {
      await onUsePreset(id);
      onOpenChange(false);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Heading>
        <Title>{t("selector.title")}</Title>
        <Description>{t("selector.subtitle")}</Description>
      </Heading>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("selector.myThemes")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themes.map((th) => {
            const active = th.id === currentThemeId;
            return (
              <div
                key={th.id}
                className={`rounded-lg border p-3 space-y-2 ${
                  active ? "border-foreground" : "border-border"
                }`}
              >
                <PresetThumbnail config={th.config} label={th.name} />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium truncate">{th.name}</p>
                    {th.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("default")}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={active ? "secondary" : "default"}
                    disabled={active || busyId === th.id}
                    onClick={() => handleApply(th.id)}
                  >
                    {active ? t("selector.applied") : t("selector.apply")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("selector.templates")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_ORDER.map((id) => (
            <div key={id} className="rounded-lg border border-border p-3 space-y-2">
              <PresetThumbnail
                config={PRESETS[id]}
                label={t(`presets.${id}.name`)}
              />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {t(`presets.${id}.name`)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t(`presets.${id}.description`)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === `preset:${id}`}
                  onClick={() => handlePreset(id)}
                >
                  {t("selector.use")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
