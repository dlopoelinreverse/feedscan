"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { saveForm, type SaveFormInput } from "@/lib/actions/form-actions";
import { MobilePreview } from "./mobile-preview";
import { QuestionCard } from "./question-card";
import { QuestionDialog } from "./question-dialog";
import { AiAssistant } from "./ai-wizard/ai-assistant";
import type {
  FormBuilderState,
  QuestionType,
  QuestionState,
<<<<<<< HEAD
  FollowUpRuleState,
=======
  PreviewLocale,
>>>>>>> feat/ai-wizard-chat
} from "./types";
import { QUESTION_TYPE_BADGE } from "./types";

interface FormBuilderProps {
  initialData?: FormBuilderState;
  userProfile?: {
    businessName?: string | null;
    businessType?: string | null;
  };
}

<<<<<<< HEAD
interface UserInfo {
  plan: "FREE" | "PRO" | "BUSINESS";
  aiGenerationsUsed: number;
}

interface GeneratedQuestion {
  type: "stars" | "emoji" | "choice" | "text";
  label: string;
  options: string[] | null;
  required: boolean;
  emojiLevels?: number | null;
  branching: {
    low: {
      triggerMin: number;
      triggerMax: number;
      followUpLabel: string;
      followUpOptions: string[];
      allowFreeText: boolean;
    };
    high: {
      triggerMin: number;
      triggerMax: number;
      followUpLabel: string;
      followUpOptions: string[];
      allowFreeText: boolean;
    };
  } | null;
}

interface GeneratedForm {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

function convertGeneratedToState(generated: GeneratedForm): {
  title: string;
  description: string;
  questions: QuestionState[];
} {
  return {
    title: generated.title,
    description: generated.description,
    questions: generated.questions.map((q, i) => {
      const followUpRules: FollowUpRuleState[] = [];
      if (q.branching) {
        followUpRules.push({
          triggerType: "LOW",
          triggerMin: q.branching.low.triggerMin,
          triggerMax: q.branching.low.triggerMax,
          followUpLabel: q.branching.low.followUpLabel,
          followUpOptions: q.branching.low.followUpOptions,
          allowFreeText: q.branching.low.allowFreeText,
          enabled: true,
          allowOptions: true,
        });
        followUpRules.push({
          triggerType: "HIGH",
          triggerMin: q.branching.high.triggerMin,
          triggerMax: q.branching.high.triggerMax,
          followUpLabel: q.branching.high.followUpLabel,
          followUpOptions: q.branching.high.followUpOptions,
          allowFreeText: q.branching.high.allowFreeText,
          enabled: true,
          allowOptions: true,
        });
      }

      return {
        clientId: nanoid(),
        type: q.type.toUpperCase() as QuestionType,
        label: q.label,
        options: q.options ?? [],
        order: i,
        required: q.required,
        hasBranching: q.branching !== null,
        emojiLevels: q.emojiLevels ?? undefined,
        followUpRules,
      };
    }),
  };
}

export function FormBuilder({ initialData }: FormBuilderProps) {
=======
export function FormBuilder({ initialData, userProfile }: FormBuilderProps) {
>>>>>>> feat/ai-wizard-chat
  const t = useTranslations("forms");
  const tWizard = useTranslations("aiWizard");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [form, setForm] = useState<FormBuilderState>(
    initialData ?? {
      title: "",
      description: "",
      status: "DRAFT",
      rateLimitMode: "PER_24H",
      questions: [],
    }
  );

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

  // AI state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<{
    type: "limit" | "validation" | "network";
    message: string;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch user info on mount
  useEffect(() => {
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUserInfo(data);
      })
      .catch(() => {});
  }, []);

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
<<<<<<< HEAD
        title: form.title.trim() || t("builder.titlePlaceholder"),
        description: form.description.trim() || undefined,
=======
        title: form.title || t("builder.titlePlaceholder"),
        titleFr: form.titleFr,
        titleEn: form.titleEn,
        description: form.description || undefined,
        descriptionFr: form.descriptionFr,
        descriptionEn: form.descriptionEn,
>>>>>>> feat/ai-wizard-chat
        status,
        rateLimitMode: form.rateLimitMode,
        rateLimitHours: form.rateLimitHours,
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

<<<<<<< HEAD
  // AI generation handlers
  const handleAiButtonClick = () => {
    if (aiPrompt.trim().length < 20) {
      toast({ title: t("ai.minLength"), variant: "destructive" });
      return;
    }

    // If there are existing questions, ask for replace confirmation first
    if (form.questions.length > 0) {
      setConfirmReplace(true);
    } else {
      setAiError(null);
      setAiDialogOpen(true);
    }
  };

  const handleConfirmReplace = () => {
    setConfirmReplace(false);
    setAiError(null);
    setAiDialogOpen(true);
  };

  const handleGenerate = async () => {
    setAiGenerating(true);
    setAiError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.status === 403) {
        const data = await res.json();
        setAiError({ type: "limit", message: data.message });
        return;
      }

      if (res.status === 422) {
        const data = await res.json();
        setAiError({ type: "validation", message: data.message });
        return;
      }

      if (!res.ok) {
        setAiError({ type: "network", message: t("ai.networkError") });
        return;
      }

      const generated: GeneratedForm = await res.json();
      const converted = convertGeneratedToState(generated);

      setForm((prev) => ({
        ...prev,
        title: converted.title,
        description: converted.description,
        questions: converted.questions,
      }));

      // Update local user info counter
      setUserInfo((prev) =>
        prev ? { ...prev, aiGenerationsUsed: prev.aiGenerationsUsed + 1 } : prev
      );

      setAiDialogOpen(false);
      setAiPrompt("");
      toast({ title: t("ai.generated") });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        setAiError({ type: "network", message: t("ai.networkError") });
      } else {
        setAiError({ type: "network", message: t("ai.networkError") });
      }
    } finally {
      setAiGenerating(false);
      abortRef.current = null;
    }
  };

  const remainingGenerations = userInfo
    ? Math.max(0, 3 - userInfo.aiGenerationsUsed)
    : null;

  const editorContent = (
    <div className="space-y-6">
      {/* AI Bar */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">
          {t("ai.generate")}
        </p>
        <div className="flex gap-2">
          <Input
            placeholder={t("ai.promptPlaceholder")}
            className="flex-1"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <Button
            onClick={handleAiButtonClick}
            className="bg-gradient-to-r from-[#6C5CE7] to-[#00B894] text-white hover:opacity-90 transition-opacity"
          >
            &#10024; {t("ai.generate")}
          </Button>
        </div>
        {/* Generation counter */}
        {userInfo && (
          <p
            className={`text-xs mt-1.5 ${
              userInfo.plan === "FREE" && userInfo.aiGenerationsUsed >= 2
                ? "text-orange-500"
                : "text-muted-foreground"
            }`}
          >
            &#9889;{" "}
            {userInfo.plan === "FREE"
              ? t("ai.generationsUsed", { count: userInfo.aiGenerationsUsed })
              : t("ai.unlimitedGenerations")}
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("builder.buildManually")}
          </span>
          <Separator className="flex-1" />
        </div>
      </section>
=======
  const handleApplyToBuilder = () => {
    setActiveTab("manual");
    toast({ title: t("builder.draftSaved") });
  };
>>>>>>> feat/ai-wizard-chat

  const handleTranslate = async () => {
    // Determine source and target
    const hasFr = form.titleFr || form.questions.some((q) => q.labelFr);
    const hasEn = form.titleEn || form.questions.some((q) => q.labelEn);

    if (hasFr && hasEn) return;

    const sourceLang = hasFr ? "fr" : "en";
    const targetLang = hasFr ? "en" : "fr";

    try {
      // Build the form data for translation API
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

      // Apply translations back to form state
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

  // Check if translation is needed
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
      <TabsList className="mx-4 mt-3 mb-0 grid grid-cols-2">
        <TabsTrigger value="assistant" className="text-xs">
          &#x2728; {tWizard("tabs.assistant")}
        </TabsTrigger>
        <TabsTrigger value="manual" className="text-xs">
          &#x270f;&#xfe0f; {tWizard("tabs.manual")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="assistant" className="flex-1 overflow-y-auto mt-0">
        <AiAssistant
          currentForm={form}
          onFormGenerated={(f) => setForm(f)}
          onFormUpdated={(f) => setForm(f)}
          onApplyToBuilder={handleApplyToBuilder}
          userProfile={userProfile}
        />
      </TabsContent>
      <TabsContent value="manual" className="flex-1 overflow-y-auto p-4 mt-0">
        {manualEditorContent}
      </TabsContent>
    </Tabs>
  );

  const previewContent = (
    <div className="flex items-start justify-center py-6">
      <MobilePreview
        form={form}
        previewLocale={previewLocale}
        onLocaleChange={setPreviewLocale}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/forms")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; {tCommon("back")}
          </button>
          <input
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder={t("builder.titlePlaceholder")}
            className="text-lg font-bold bg-transparent border-none outline-none w-auto min-w-[200px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
          >
            {form.status === "ACTIVE"
              ? t("builder.unpublish")
              : t("builder.saveDraft")}
          </Button>
          <Button
            onClick={() => handleSave("ACTIVE")}
            disabled={saving}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
          >
            {form.status === "ACTIVE"
              ? t("builder.republish")
              : t("builder.publish")}
          </Button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex-1 flex flex-col">
        <Tabs defaultValue="edit" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 mb-0">
            <TabsTrigger value="edit">{t("builder.edit")}</TabsTrigger>
            <TabsTrigger value="preview">{t("builder.preview")}</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="flex-1 overflow-y-auto flex flex-col">
            {leftColumnContent}
          </TabsContent>
          <TabsContent
            value="preview"
            className="flex-1 overflow-y-auto bg-gray-50 p-4"
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

      {/* Confirm replace dialog */}
      <Dialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ai.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("ai.confirmReplace")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReplace(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleConfirmReplace}
              className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
            >
              {tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI generation dialog */}
      <Dialog
        open={aiDialogOpen}
        onOpenChange={(open) => {
          if (!open && !aiGenerating) {
            setAiDialogOpen(false);
            setAiError(null);
          }
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            if (aiGenerating) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (aiGenerating) e.preventDefault();
          }}
          className={aiGenerating ? "[&>button]:hidden" : ""}
        >
          <DialogHeader>
            <DialogTitle>{t("ai.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("ai.confirmPrompt")}</DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-muted p-3 text-sm">{aiPrompt}</div>

          {userInfo?.plan === "FREE" && (
            <p className="text-sm text-muted-foreground">
              &#9889; {t("ai.remaining", { count: remainingGenerations ?? 0 })}
            </p>
          )}

          {aiError && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{aiError.message}</p>
              {aiError.type === "limit" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/settings")}
                >
                  {t("ai.upgradeToPro")}
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            {!aiGenerating && (
              <Button
                variant="outline"
                onClick={() => {
                  setAiDialogOpen(false);
                  setAiError(null);
                }}
              >
                {tCommon("cancel")}
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={aiGenerating}
              className="bg-gradient-to-r from-[#6C5CE7] to-[#00B894] text-white"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("ai.generating")}
                </>
              ) : aiError && aiError.type !== "limit" ? (
                t("ai.retry")
              ) : (
                t("ai.confirmGenerate")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
