"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { PresetThumbnail } from "./preset-thumbnail";
import { ThemeSelector } from "./theme-selector";
import { ThemeEditorShell } from "./theme-editor-shell";
import {
  applyThemeToForm,
  createThemeFromPreset,
  duplicateTheme,
  updateTheme,
} from "@/lib/actions/theme-actions";
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeRecord,
} from "@/lib/themes/types";
import type { FormBuilderState } from "@/components/forms/types";

interface AppearancePanelProps {
  formId: string | undefined;
  formState: FormBuilderState;
  themes: ThemeRecord[];
  selectedThemeId: string | null;
  onThemeChange: (themeId: string, theme: ThemeRecord) => void;
  onThemesUpdated: (themes: ThemeRecord[], selectedId: string) => void;
  formCountByTheme?: Record<string, number>;
}

export function AppearancePanel({
  formId,
  formState,
  themes,
  selectedThemeId,
  onThemeChange,
  onThemesUpdated,
  formCountByTheme = {},
}: AppearancePanelProps) {
  const t = useTranslations("themes");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const selected =
    themes.find((th) => th.id === selectedThemeId) ?? themes[0] ?? null;

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">{t("noThemes")}</p>
    );
  }

  const formCountForSelected = formCountByTheme[selected.id] ?? 0;
  const sharedWithOthers = formCountForSelected > 1;

  const updateLocalTheme = (next: ThemeRecord) => {
    const nextThemes = themes.map((th) => (th.id === next.id ? next : th));
    onThemesUpdated(nextThemes, next.id);
  };

  const handleApplyTheme = async (themeId: string) => {
    const target = themes.find((th) => th.id === themeId);
    if (!target) return;
    if (formId) {
      try {
        await applyThemeToForm(formId, themeId);
      } catch {
        toast({ title: tCommon("error"), variant: "destructive" });
        return;
      }
    }
    onThemeChange(themeId, target);
  };

  const handleUsePreset = async (presetId: ThemePresetId) => {
    try {
      const created = await createThemeFromPreset(
        presetId,
        t(`presets.${presetId}.name`)
      );
      const nextThemes = [...themes, created];
      onThemesUpdated(nextThemes, created.id);
      if (formId) {
        await applyThemeToForm(formId, created.id);
      }
      onThemeChange(created.id, created);
      toast({ title: t("toasts.themeCreated") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const openEdit = () => {
    if (sharedWithOthers) {
      setConfirmEditOpen(true);
    } else {
      setEditorOpen(true);
    }
  };

  const handleSaveEdit = async (input: { name: string; config: ThemeConfig }) => {
    setSaving(true);
    try {
      const updated = await updateTheme({
        id: selected.id,
        name: input.name,
        config: input.config,
      });
      updateLocalTheme(updated);
      toast({ title: t("toasts.themeSaved") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateForThisForm = async () => {
    try {
      const created = await duplicateTheme(selected.id, `${selected.name} ✦`);
      const nextThemes = [...themes, created];
      onThemesUpdated(nextThemes, created.id);
      if (formId) {
        await applyThemeToForm(formId, created.id);
      }
      onThemeChange(created.id, created);
      toast({ title: t("toasts.themeDuplicated") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {tForms("appearance.activeTheme")}
      </p>

      <div className="rounded-lg border border-border p-3 space-y-3">
        <PresetThumbnail config={selected.config} label={selected.name} />
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium">{selected.name}</p>
            {selected.isDefault && (
              <Badge variant="secondary" className="text-[10px]">
                {t("default")}
              </Badge>
            )}
          </div>
          {formId && (
            <p className="text-[11px] text-muted-foreground">
              {t("usedByForms", { count: formCountForSelected })}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectorOpen(true)}
            className="flex-1"
          >
            {tForms("appearance.changeTheme")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openEdit}
            className="flex-1"
          >
            {tForms("appearance.editTheme")}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDuplicateForThisForm}
          className="w-full"
        >
          {tForms("appearance.duplicateForForm")}
        </Button>
      </div>

      <ThemeSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        themes={themes}
        currentThemeId={selected.id}
        onApply={handleApplyTheme}
        onUsePreset={handleUsePreset}
      />

      <ThemeEditorShell
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={t("editor.editTitle")}
        initialName={selected.name}
        initialConfig={selected.config}
        previewForm={formState}
        onSave={handleSaveEdit}
        saving={saving}
      />

      <ConfirmDialog
        open={confirmEditOpen}
        onOpenChange={setConfirmEditOpen}
        title={t("confirmEdit.title")}
        body={t("confirmEdit.body", { count: formCountForSelected })}
        confirmLabel={t("confirmEdit.continue")}
        onConfirm={() => {
          setConfirmEditOpen(false);
          setEditorOpen(true);
        }}
      />
    </div>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const tCommon = useTranslations("common");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background rounded-lg border border-border p-4 max-w-sm w-full space-y-3 shadow-lg">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
