"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { PresetThumbnail } from "./preset-thumbnail";
import { ThemeEditorShell } from "./theme-editor-shell";
import { ThemeSelector } from "./theme-selector";
import {
  createTheme,
  createThemeFromPreset,
  deleteTheme,
  duplicateTheme,
  renameTheme,
  setDefaultTheme,
  updateTheme,
} from "@/lib/actions/theme-actions";
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeRecord,
} from "@/lib/themes/types";
import { PRESETS } from "@/lib/themes/presets";
import type { FormBuilderState } from "@/components/forms/types";

type Theme = ThemeRecord & { formCount: number };

interface ThemesClientProps {
  initialThemes: Theme[];
}

const SAMPLE_FORM: FormBuilderState = {
  title: "Aperçu",
  description: "",
  status: "DRAFT",
  rateLimitMode: "PER_24H",
  questions: [
    {
      clientId: "q1",
      type: "STARS",
      label: "Globalement, comment évaluez-vous votre expérience ?",
      options: [],
      order: 0,
      required: true,
      hasBranching: false,
      followUpRules: [],
    },
    {
      clientId: "q2",
      type: "CHOICE",
      label: "Qu'avez-vous préféré ?",
      options: ["Le service", "Les produits", "L'ambiance"],
      order: 1,
      required: false,
      hasBranching: false,
      followUpRules: [],
    },
  ],
};

export function ThemesClient({ initialThemes }: ThemesClientProps) {
  const t = useTranslations("themes");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [themes, setThemes] = useState<Theme[]>(initialThemes);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editingTheme = themes.find((th) => th.id === editingId) ?? null;

  const refresh = () => router.refresh();

  const openEditor = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const handleSaveEdit = async (input: { name: string; config: ThemeConfig }) => {
    if (!editingTheme) return;
    setSaving(true);
    try {
      const updated = await updateTheme({
        id: editingTheme.id,
        name: input.name,
        config: input.config,
      });
      setThemes((prev) =>
        prev.map((th) =>
          th.id === updated.id
            ? { ...th, name: updated.name, config: updated.config }
            : th
        )
      );
      toast({ title: t("toasts.themeSaved") });
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      setRenameId(null);
      return;
    }
    try {
      await renameTheme(id, renameValue.trim());
      setThemes((prev) =>
        prev.map((th) =>
          th.id === id ? { ...th, name: renameValue.trim() } : th
        )
      );
      setRenameId(null);
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const created = await duplicateTheme(id);
      setThemes((prev) => [...prev, { ...created, formCount: 0 }]);
      toast({ title: t("toasts.themeDuplicated") });
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTheme(id);
      setThemes((prev) =>
        prev.map((th) => ({ ...th, isDefault: th.id === id }))
      );
      toast({ title: t("toasts.defaultSet") });
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deletePending) return;
    const id = deletePending;
    try {
      await deleteTheme(id);
      setThemes((prev) => prev.filter((th) => th.id !== id));
      toast({ title: t("toasts.themeDeleted") });
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "LAST_THEME") {
        toast({ title: t("toasts.cannotDeleteLast"), variant: "destructive" });
      } else {
        toast({ title: tCommon("error"), variant: "destructive" });
      }
    } finally {
      setDeletePending(null);
    }
  };

  const handleNewBlank = async () => {
    try {
      const created = await createTheme({
        name: t("untitled"),
        config: PRESETS.minimal,
      });
      setThemes((prev) => [...prev, { ...created, formCount: 0 }]);
      openEditor(created.id);
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const handleUsePreset = async (presetId: ThemePresetId) => {
    try {
      const created = await createThemeFromPreset(
        presetId,
        t(`presets.${presetId}.name`)
      );
      setThemes((prev) => [...prev, { ...created, formCount: 0 }]);
      toast({ title: t("toasts.themeCreated") });
      refresh();
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const themeToDelete = themes.find((th) => th.id === deletePending) ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("page.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("page.subtitle")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setSelectorOpen(true)}>
            {t("page.browseTemplates")}
          </Button>
          <Button onClick={handleNewBlank}>{t("page.newTheme")}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((th) => (
          <article
            key={th.id}
            className="rounded-lg border border-border p-3 space-y-3 bg-card"
          >
            <PresetThumbnail config={th.config} label={th.name} size="lg" />
            <div className="space-y-1">
              {renameId === th.id ? (
                <div className="flex gap-1">
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(th.id);
                      if (e.key === "Escape") setRenameId(null);
                    }}
                    onBlur={() => handleRename(th.id)}
                    className="h-8"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-medium">{th.name}</h3>
                  {th.isDefault && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t("default")}
                    </Badge>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                {t("usedByForms", { count: th.formCount })}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditor(th.id)}
              >
                {t("actions.edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRenameId(th.id);
                  setRenameValue(th.name);
                }}
              >
                {t("actions.rename")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDuplicate(th.id)}
              >
                {t("actions.duplicate")}
              </Button>
              {!th.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetDefault(th.id)}
                >
                  {t("actions.setDefault")}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={themes.length <= 1}
                onClick={() => setDeletePending(th.id)}
              >
                {t("actions.delete")}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {editingTheme && (
        <ThemeEditorShell
          open={editorOpen}
          onOpenChange={setEditorOpen}
          title={t("editor.editTitle")}
          initialName={editingTheme.name}
          initialConfig={editingTheme.config}
          previewForm={SAMPLE_FORM}
          onSave={handleSaveEdit}
          saving={saving}
        />
      )}

      <ThemeSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        themes={themes}
        currentThemeId={null}
        onApply={async () => undefined}
        onUsePreset={handleUsePreset}
      />

      {themeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-lg border border-border p-4 max-w-sm w-full space-y-3 shadow-lg">
            <h4 className="font-semibold">{t("deleteConfirm.title")}</h4>
            <p className="text-sm text-muted-foreground">
              {themeToDelete.formCount > 0
                ? t("deleteConfirm.bodyWithForms", {
                    count: themeToDelete.formCount,
                  })
                : t("deleteConfirm.body")}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletePending(null)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDelete}
              >
                {t("actions.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
