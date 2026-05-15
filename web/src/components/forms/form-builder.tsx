"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { saveForm, type SaveFormInput } from "@/lib/actions/form-actions";
import { MobilePreview } from "./mobile-preview";
import { QuestionCard } from "./question-card";
import { QuestionDialog } from "./question-dialog";
import { AiAssistant } from "./ai-wizard/ai-assistant";
import { useAiAssistant, migrateAiAssistantStorage } from "./ai-wizard/use-ai-assistant";
import { AppearancePanel } from "@/components/themes/appearance-panel";
import type {
  FormBuilderState,
  QuestionType,
  QuestionState,
  PreviewLocale,
} from "./types";
import { QUESTION_TYPE_BADGE } from "./types";
import type { ThemeRecord } from "@/lib/themes/types";

const FORM_STORAGE_PREFIX = "feedscan:form-builder:";

function formStorageKey(formId: string | undefined): string {
  return `${FORM_STORAGE_PREFIX}${formId ?? "new"}`;
}

function loadPersistedForm(formId: string | undefined): FormBuilderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(formStorageKey(formId));
    if (!raw) return null;
    return JSON.parse(raw) as FormBuilderState;
  } catch {
    return null;
  }
}

function persistForm(formId: string | undefined, form: FormBuilderState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(formStorageKey(formId), JSON.stringify(form));
  } catch {
    // ignore quota / serialization errors
  }
}

function migrateFormStorage(
  from: string | undefined,
  to: string | undefined
): void {
  if (typeof window === "undefined" || from === to) return;
  try {
    const fromKey = formStorageKey(from);
    const data = window.sessionStorage.getItem(fromKey);
    if (data) {
      window.sessionStorage.setItem(formStorageKey(to), data);
      window.sessionStorage.removeItem(fromKey);
    }
  } catch {
    // ignore
  }
}

interface FormBuilderProps {
  initialData?: FormBuilderState;
  userProfile?: {
    businessName?: string | null;
    businessType?: string | null;
  };
  themes: ThemeRecord[];
  initialThemeId: string | null;
  formCountByTheme?: Record<string, number>;
}

export function FormBuilder({
  initialData,
  userProfile,
  themes: initialThemes,
  initialThemeId,
  formCountByTheme,
}: FormBuilderProps) {
  const t = useTranslations("forms");
  const tWizard = useTranslations("aiWizard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormBuilderState>(() => {
    const persisted = loadPersistedForm(initialData?.id);
    if (persisted) {
      if (initialData) {
        return {
          ...persisted,
          id: initialData.id,
          status: initialData.status,
        };
      }
      return persisted;
    }
    return (
      initialData ?? {
        title: "",
        description: "",
        status: "DRAFT",
        rateLimitMode: "PER_24H",
        questions: [],
      }
    );
  });

  useEffect(() => {
    persistForm(form.id, form);
  }, [form]);

  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<QuestionType>("STARS");
  const [editingQuestion, setEditingQuestion] = useState<
    QuestionState | undefined
  >();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    initialData ? "manual" : "assistant"
  );
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>("fr");
  const [themes, setThemes] = useState<ThemeRecord[]>(initialThemes);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(
    initialThemeId
  );
  const selectedTheme =
    themes.find((th) => th.id === selectedThemeId) ?? themes[0] ?? null;

  const aiAssistant = useAiAssistant({
    onFormGenerated: (f) =>
      setForm((prev) => ({ ...f, id: prev.id, status: prev.status })),
    onFormUpdated: (f) =>
      setForm((prev) => ({ ...f, id: prev.id, status: prev.status })),
    userLocale: locale,
    initialBusinessName: userProfile?.businessName || "",
    initialBusinessType: userProfile?.businessType || "",
    formId: initialData?.id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateForm = useCallback(
    (patch: Partial<FormBuilderState>) =>
      setForm((prev) => ({ ...prev, ...patch })),
    []
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setForm((prev) => {
      const oldIndex = prev.questions.findIndex(
        (q) => q.clientId === active.id
      );
      const newIndex = prev.questions.findIndex((q) => q.clientId === over.id);
      const reordered = arrayMove(prev.questions, oldIndex, newIndex).map(
        (q, i) => ({ ...q, order: i })
      );
      return { ...prev, questions: reordered };
    });
  };

  const addQuestion = (type: QuestionType) => {
    if (form.questions.length >= 7) return;
    setDialogType(type);
    setEditingQuestion(undefined);
    setDialogOpen(true);
  };

  const handleEditQuestion = (q: QuestionState) => {
    setDialogType(q.type);
    setEditingQuestion(q);
    setDialogOpen(true);
  };

  const handleSaveQuestion = (q: QuestionState) => {
    setForm((prev) => {
      const exists = prev.questions.find((x) => x.clientId === q.clientId);
      if (exists) {
        return {
          ...prev,
          questions: prev.questions.map((x) =>
            x.clientId === q.clientId ? q : x
          ),
        };
      }
      return { ...prev, questions: [...prev.questions, q] };
    });
  };

  const handleDuplicate = (q: QuestionState) => {
    if (form.questions.length >= 7) return;
    setForm((prev) => {
      const sourceIdx = prev.questions.findIndex(
        (x) => x.clientId === q.clientId
      );
      const dup: QuestionState = {
        ...q,
        clientId: nanoid(),
        id: undefined,
        label: `${q.label} (copie)`,
        options: [...q.options],
        followUpRules: q.followUpRules.map((r) => ({ ...r, id: undefined })),
        order: sourceIdx + 1,
      };
      const next = [
        ...prev.questions.slice(0, sourceIdx + 1),
        dup,
        ...prev.questions.slice(sourceIdx + 1),
      ].map((x, i) => ({ ...x, order: i }));
      return { ...prev, questions: next };
    });
  };

  const handleDeleteQuestion = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.clientId !== clientId)
        .map((q, i) => ({ ...q, order: i })),
    }));
  };

  const validateForPublish = (): string | null => {
    if (form.questions.length < 3) {
      return t("builder.minQuestions");
    }
    if (form.questions.length > 7) {
      return t("builder.maxQuestions");
    }
    for (const q of form.questions) {
      if (!q.label.trim()) {
        return t("validation.emptyLabel");
      }
      if (q.type === "CHOICE" && q.options.length < 2) {
        return t("validation.minTwoOptions");
      }
    }
    return null;
  };

  const handleSave = async (status: "DRAFT" | "ACTIVE") => {
    if (status === "ACTIVE") {
      const error = validateForPublish();
      if (error) {
        toast({ title: error, variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const input: SaveFormInput = {
        id: form.id,
        title: form.title.trim() || t("builder.titlePlaceholder"),
        titleFr: form.titleFr,
        titleEn: form.titleEn,
        description: form.description.trim() || undefined,
        descriptionFr: form.descriptionFr,
        descriptionEn: form.descriptionEn,
        status,
        rateLimitMode: form.rateLimitMode,
        rateLimitHours: form.rateLimitHours,
        themeId: selectedThemeId ?? undefined,
        questions: form.questions.map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          labelFr: q.labelFr,
          labelEn: q.labelEn,
          options: q.options.length > 0 ? q.options : undefined,
          optionsFr: q.optionsFr,
          optionsEn: q.optionsEn,
          order: q.order,
          required: q.required,
          hasBranching: q.hasBranching,
          followUpRules: q.followUpRules.map((r) => ({
            ...r,
            followUpLabelFr: r.followUpLabelFr,
            followUpLabelEn: r.followUpLabelEn,
            followUpOptionsFr: r.followUpOptionsFr,
            followUpOptionsEn: r.followUpOptionsEn,
          })),
        })),
      };

      const result = await saveForm(input);

      if (status === "DRAFT") {
        toast({ title: t("builder.draftSaved") });
        setForm((prev) => ({ ...prev, id: result.id, status: "DRAFT" }));
        if (!form.id) {
          migrateAiAssistantStorage(undefined, result.id);
          migrateFormStorage(undefined, result.id);
          router.replace(`/dashboard/forms/${result.id}/edit`);
        }
      } else {
        toast({ title: t("builder.published") });
        router.push(`/dashboard/forms/${result.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      if (message === "PLAN_LIMIT") {
        toast({ title: t("planLimit"), variant: "destructive" });
      } else {
        toast({ title: tCommon("error"), variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToBuilder = () => {
    setActiveTab("manual");
    toast({ title: t("builder.draftSaved") });
  };

  const handleTranslate = async () => {
    const hasFr = form.titleFr || form.questions.some((q) => q.labelFr);
    const hasEn = form.titleEn || form.questions.some((q) => q.labelEn);

    if (hasFr && hasEn) return;

    const sourceLang = hasFr ? "fr" : "en";
    const targetLang = hasFr ? "en" : "fr";

    try {
      const formData = {
        titleFr: form.titleFr || form.title,
        titleEn: form.titleEn || form.title,
        descriptionFr: form.descriptionFr || form.description,
        descriptionEn: form.descriptionEn || form.description,
        questions: form.questions.map((q) => ({
          type: q.type.toLowerCase(),
          labelFr: q.labelFr || q.label,
          labelEn: q.labelEn || q.label,
          optionsFr: q.optionsFr?.length ? q.optionsFr : q.options.length ? q.options : null,
          optionsEn: q.optionsEn?.length ? q.optionsEn : null,
          required: q.required,
          emojiLevels: q.emojiLevels ?? null,
          branching: q.hasBranching && q.followUpRules.length >= 2
            ? {
                low: {
                  triggerMin: q.followUpRules[0].triggerMin,
                  triggerMax: q.followUpRules[0].triggerMax,
                  followUpLabelFr: q.followUpRules[0].followUpLabelFr || q.followUpRules[0].followUpLabel,
                  followUpLabelEn: q.followUpRules[0].followUpLabelEn || q.followUpRules[0].followUpLabel,
                  followUpOptionsFr: q.followUpRules[0].followUpOptionsFr || q.followUpRules[0].followUpOptions,
                  followUpOptionsEn: q.followUpRules[0].followUpOptionsEn || q.followUpRules[0].followUpOptions,
                  allowFreeText: q.followUpRules[0].allowFreeText,
                },
                high: {
                  triggerMin: q.followUpRules[1].triggerMin,
                  triggerMax: q.followUpRules[1].triggerMax,
                  followUpLabelFr: q.followUpRules[1].followUpLabelFr || q.followUpRules[1].followUpLabel,
                  followUpLabelEn: q.followUpRules[1].followUpLabelEn || q.followUpRules[1].followUpLabel,
                  followUpOptionsFr: q.followUpRules[1].followUpOptionsFr || q.followUpRules[1].followUpOptions,
                  followUpOptionsEn: q.followUpRules[1].followUpOptionsEn || q.followUpRules[1].followUpOptions,
                  allowFreeText: q.followUpRules[1].allowFreeText,
                },
              }
            : null,
        })),
      };

      const res = await fetch("/api/ai/translate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: formData, sourceLang, targetLang }),
      });

      if (!res.ok) throw new Error("Translation failed");

      const translated = await res.json();

      setForm((prev) => ({
        ...prev,
        titleFr: translated.titleFr,
        titleEn: translated.titleEn,
        descriptionFr: translated.descriptionFr,
        descriptionEn: translated.descriptionEn,
        questions: prev.questions.map((q, i) => {
          const tq = translated.questions[i];
          if (!tq) return q;
          return {
            ...q,
            labelFr: tq.labelFr,
            labelEn: tq.labelEn,
            optionsFr: tq.optionsFr ?? q.optionsFr,
            optionsEn: tq.optionsEn ?? q.optionsEn,
          };
        }),
      }));

      toast({ title: tWizard("chat.translationsGenerated") });
    } catch {
      toast({ title: tCommon("error"), variant: "destructive" });
    }
  };

  const needsTranslation =
    form.questions.length > 0 &&
    (!form.questions.every((q) => q.labelFr && q.labelEn));

  const manualEditorContent = (
    <div className="space-y-6">
      {/* Description */}
      <section>
        <Label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          {t("builder.description")}
        </Label>
        <Textarea
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder={t("builder.descriptionPlaceholder")}
          className="mt-2"
          rows={2}
        />
      </section>

      {/* Questions */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {t("builder.questionCount", { count: form.questions.length })}
          </p>
          {form.questions.length > 0 && form.questions.length < 3 && (
            <span className="text-xs text-orange-500 font-medium">
              {t("builder.minQuestions")}
            </span>
          )}
          {form.questions.length >= 7 && (
            <span className="text-xs text-red-500 font-medium">
              {t("builder.maxQuestions")}
            </span>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={form.questions.map((q) => q.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <QuestionCard
                  key={q.clientId}
                  question={q}
                  index={i}
                  onEdit={() => handleEditQuestion(q)}
                  onDuplicate={() => handleDuplicate(q)}
                  onDelete={() => handleDeleteQuestion(q.clientId)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add question buttons */}
        {form.questions.length < 7 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">
              {t("addQuestion")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(["STARS", "EMOJI", "CHOICE", "TEXT"] as QuestionType[]).map(
                (type) => {
                  const badge = QUESTION_TYPE_BADGE[type];
                  return (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className={`px-3 py-1.5 rounded-md border border-dashed text-sm font-medium transition-colors hover:border-solid ${badge.bg} ${badge.text}`}
                    >
                      +{" "}
                      {t(
                        `questionTypes.${type.toLowerCase()}` as
                          | "questionTypes.stars"
                          | "questionTypes.emoji"
                          | "questionTypes.choice"
                          | "questionTypes.text"
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      {/* Auto-translate button */}
      {needsTranslation && (
        <section>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslate}
            className="w-full"
          >
            &#x1f310; {t("builder.autoTranslate")}
          </Button>
        </section>
      )}

      {/* Advanced settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span
              className="inline-block transition-transform"
              style={{
                transform: settingsOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              &#9656;
            </span>
            {t("rateLimit.title")}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">{t("rateLimit.frequency")}</Label>
            <Select
              value={form.rateLimitMode}
              onValueChange={(v) =>
                updateForm({
                  rateLimitMode: v as FormBuilderState["rateLimitMode"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["NONE", "PER_SESSION", "PER_24H", "PER_WEEK", "CUSTOM"] as const
                ).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {t(
                      `rateLimit.modes.${mode.toLowerCase()}` as
                        | "rateLimit.modes.none"
                        | "rateLimit.modes.per_session"
                        | "rateLimit.modes.per_24h"
                        | "rateLimit.modes.per_week"
                        | "rateLimit.modes.custom"
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.rateLimitMode === "CUSTOM" && (
            <div className="space-y-2">
              <Label className="text-sm">{t("rateLimit.customHours")}</Label>
              <Input
                type="number"
                min={1}
                value={form.rateLimitHours ?? ""}
                onChange={(e) =>
                  updateForm({
                    rateLimitHours: Number(e.target.value) || undefined,
                  })
                }
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  const leftColumnContent = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
      <TabsList className="mx-4 mt-3 mb-0 grid grid-cols-3">
        <TabsTrigger value="assistant" className="text-xs">
          {tWizard("tabs.assistant")}
        </TabsTrigger>
        <TabsTrigger value="manual" className="text-xs">
          {tWizard("tabs.manual")}
        </TabsTrigger>
        <TabsTrigger value="appearance" className="text-xs">
          {t("appearance.tabTitle")}
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="assistant"
        forceMount
        className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden"
      >
        <AiAssistant
          currentForm={form}
          onApplyToBuilder={handleApplyToBuilder}
          assistant={aiAssistant}
        />
      </TabsContent>
      <TabsContent
        value="manual"
        forceMount
        className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden"
      >
        {manualEditorContent}
      </TabsContent>
      <TabsContent
        value="appearance"
        forceMount
        className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden"
      >
        <AppearancePanel
          formId={form.id}
          formState={form}
          themes={themes}
          selectedThemeId={selectedThemeId}
          onThemeChange={(id) => setSelectedThemeId(id)}
          onThemesUpdated={(next, selectedId) => {
            setThemes(next);
            setSelectedThemeId(selectedId);
          }}
          formCountByTheme={formCountByTheme}
        />
      </TabsContent>
    </Tabs>
  );

  const previewContent = (
    <div className="flex items-start justify-center py-6">
      <MobilePreview
        form={form}
        previewLocale={previewLocale}
        onLocaleChange={setPreviewLocale}
        theme={selectedTheme?.config}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-border px-2 sm:px-4 py-2 sm:py-3 bg-card shrink-0 gap-2">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push("/dashboard/forms")}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 px-1"
            aria-label={tCommon("back")}
          >
            <span className="sm:hidden text-xl leading-none">&larr;</span>
            <span className="hidden sm:inline">&larr; {tCommon("back")}</span>
          </button>
          <input
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder={t("builder.titlePlaceholder")}
            className="text-base sm:text-lg font-bold bg-transparent border-none outline-none min-w-0 flex-1 truncate"
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="px-2 sm:px-3"
            aria-label={
              form.status === "ACTIVE"
                ? t("builder.unpublish")
                : t("builder.saveDraft")
            }
          >
            <span className="sm:hidden">&#x1f4be;</span>
            <span className="hidden sm:inline">
              {form.status === "ACTIVE"
                ? t("builder.unpublish")
                : t("builder.saveDraft")}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave("ACTIVE")}
            disabled={saving}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white px-2 sm:px-3"
            aria-label={
              form.status === "ACTIVE"
                ? t("builder.republish")
                : t("builder.publish")
            }
          >
            <span className="sm:hidden">&#x1f680;</span>
            <span className="hidden sm:inline">
              {form.status === "ACTIVE"
                ? t("builder.republish")
                : t("builder.publish")}
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex-1 min-h-0 flex flex-col">
        <Tabs defaultValue="edit" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="mx-4 mt-3 mb-0">
            <TabsTrigger value="edit">{t("builder.edit")}</TabsTrigger>
            <TabsTrigger value="preview">{t("builder.preview")}</TabsTrigger>
          </TabsList>
          <TabsContent
            value="edit"
            forceMount
            className="flex-1 min-h-0 overflow-y-auto flex-col data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {leftColumnContent}
          </TabsContent>
          <TabsContent
            value="preview"
            forceMount
            className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4 data-[state=inactive]:hidden"
          >
            {previewContent}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop split */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          {leftColumnContent}
        </div>
        <div className="w-[340px] border-l border-border bg-gray-50 overflow-y-auto shrink-0">
          <p className="text-xs text-center text-muted-foreground pt-4 pb-2">
            {tWizard("preview.title")}
          </p>
          {previewContent}
        </div>
      </div>

      {/* Question Dialog */}
      <QuestionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveQuestion}
        type={dialogType}
        editing={editingQuestion}
        nextOrder={form.questions.length}
      />
    </div>
  );
}
