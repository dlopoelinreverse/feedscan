"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobilePreview } from "@/components/forms/mobile-preview";
import { PresetThumbnail } from "./preset-thumbnail";
import { BACKGROUND_PALETTE, PRESETS, PRESET_ORDER } from "@/lib/themes/presets";
import {
  contrastRatio,
  isValidHex,
  normalizeHex,
  readableTextOn,
} from "@/lib/themes/colors";
import { FONT_KEYS, RADIUS_KEYS } from "@/lib/themes/types";
import type {
  ThemeConfig,
  ThemeFont,
  ThemePresetId,
  ThemeRadius,
} from "@/lib/themes/types";
import type { FormBuilderState } from "@/components/forms/types";

interface ThemeEditorProps {
  initialName: string;
  initialConfig: ThemeConfig;
  previewForm: FormBuilderState;
  onCancel?: () => void;
  onSave: (input: { name: string; config: ThemeConfig }) => Promise<void> | void;
  saving?: boolean;
  showName?: boolean;
}

export function ThemeEditor({
  initialName,
  initialConfig,
  previewForm,
  onCancel,
  onSave,
  saving,
  showName = true,
}: ThemeEditorProps) {
  const t = useTranslations("themes");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initialName);
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);
  const [primaryInput, setPrimaryInput] = useState(initialConfig.primaryColor);

  const text = readableTextOn(config.backgroundColor);
  const ratio = useMemo(
    () => contrastRatio(text, config.backgroundColor),
    [text, config.backgroundColor]
  );
  const primaryOnBg = useMemo(
    () => contrastRatio(config.primaryColor, config.backgroundColor),
    [config.primaryColor, config.backgroundColor]
  );

  const wcagWarning = ratio < 4.5 || primaryOnBg < 3;

  const updateConfig = (patch: Partial<ThemeConfig>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  const applyPreset = (id: ThemePresetId) => {
    const p = PRESETS[id];
    setConfig({ ...p });
    setPrimaryInput(p.primaryColor);
  };

  const handlePrimaryHex = (v: string) => {
    setPrimaryInput(v);
    if (isValidHex(v)) {
      updateConfig({ primaryColor: normalizeHex(v) });
    }
  };

  const handleSubmit = async () => {
    await onSave({ name: name.trim() || t("untitled"), config });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
      <div className="flex-1 min-w-0 space-y-5 md:max-h-[70vh] md:overflow-y-auto md:pr-2">
        {showName && (
          <section className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("editor.name")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("editor.namePlaceholder")}
            />
          </section>
        )}

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.preset")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                className={`text-left rounded-md border transition-colors p-2 hover:border-foreground ${
                  config.preset === id
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border"
                }`}
              >
                <PresetThumbnail
                  config={PRESETS[id]}
                  label={t(`presets.${id}.name`)}
                  size="sm"
                />
                <p className="text-[11px] font-medium mt-1.5">
                  {t(`presets.${id}.name`)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.primaryColor")}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={t("editor.primaryColor")}
              value={config.primaryColor}
              onChange={(e) => {
                setPrimaryInput(e.target.value);
                updateConfig({ primaryColor: normalizeHex(e.target.value) });
              }}
              className="h-11 w-12 rounded-md border border-border cursor-pointer bg-transparent"
            />
            <Input
              value={primaryInput}
              onChange={(e) => handlePrimaryHex(e.target.value)}
              className="font-mono uppercase"
              maxLength={7}
            />
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.background")}
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUND_PALETTE.map((bg) => {
              const active = config.backgroundColor.toUpperCase() === bg.hex;
              return (
                <button
                  key={bg.key}
                  type="button"
                  onClick={() => updateConfig({ backgroundColor: bg.hex })}
                  className={`group flex flex-col items-center gap-1 rounded-md border p-2 transition-colors min-h-[44px] ${
                    active
                      ? "border-foreground ring-2 ring-foreground/10"
                      : "border-border hover:border-foreground/60"
                  }`}
                  aria-label={t(`backgrounds.${bg.key}`)}
                >
                  <span
                    className="h-7 w-full rounded"
                    style={{
                      background: bg.hex,
                      border:
                        bg.hex === "#FFFFFF" ? "1px solid #E5E7EB" : "none",
                    }}
                  />
                  <span className="text-[10px] font-medium">
                    {t(`backgrounds.${bg.key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.font")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FONT_KEYS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => updateConfig({ fontFamily: f as ThemeFont })}
                className={`rounded-md border p-3 text-left transition-colors min-h-[60px] ${
                  config.fontFamily === f
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border hover:border-foreground/60"
                }`}
              >
                <p
                  className="text-xl font-bold leading-none"
                  style={{
                    fontFamily: previewFontStack(f as ThemeFont),
                  }}
                >
                  Aa
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t(`fonts.${f}`)}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.radius")}
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {RADIUS_KEYS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateConfig({ borderRadius: r as ThemeRadius })}
                className={`min-h-[44px] border transition-colors flex items-center justify-center text-xs font-medium ${
                  config.borderRadius === r
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border hover:border-foreground/60"
                }`}
                style={{
                  borderRadius: r === "sm" ? 6 : r === "md" ? 12 : 22,
                }}
              >
                {t(`radius.${r}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("editor.logo")}
          </Label>
          <div className="rounded-md border border-dashed border-border p-4 flex items-center justify-between gap-2 opacity-70">
            <p className="text-xs text-muted-foreground">
              {t("editor.logoHint")}
            </p>
            <Badge variant="secondary">{t("editor.comingSoon")}</Badge>
          </div>
        </section>

        {wcagWarning && (
          <div className="rounded-md border border-orange-300 bg-orange-50 p-3 text-xs text-orange-800 space-y-1">
            <p className="font-semibold">{t("editor.contrastTitle")}</p>
            <p>{t("editor.contrastHint")}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              {tCommon("cancel")}
            </Button>
          )}
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? t("editor.saving") : t("editor.save")}
          </Button>
        </div>
      </div>

      <div className="md:w-[300px] shrink-0 flex flex-col items-center justify-start gap-2 bg-gray-50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">{t("editor.preview")}</p>
        <MobilePreview form={previewForm} theme={config} />
      </div>
    </div>
  );
}

function previewFontStack(f: ThemeFont): string {
  const serifs = new Set(["playfair", "lora", "crimson"]);
  return serifs.has(f) ? "Georgia, serif" : "system-ui, sans-serif";
}
