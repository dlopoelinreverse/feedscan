"use client";

import { useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import type {
  FormBuilderState,
  QuestionType,
  QuestionState,
} from "./types";
import { QUESTION_TYPE_BADGE } from "./types";

interface FormBuilderProps {
  initialData?: FormBuilderState;
}

export function FormBuilder({ initialData }: FormBuilderProps) {
  const t = useTranslations("forms");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [form, setForm] = useState<FormBuilderState>(
    initialData ?? {
      title: "",
      description: "",
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
    const dup: QuestionState = {
      ...q,
      clientId: nanoid(),
      id: undefined,
      order: form.questions.length,
      followUpRules: q.followUpRules.map((r) => ({ ...r, id: undefined })),
    };
    setForm((prev) => ({ ...prev, questions: [...prev.questions, dup] }));
  };

  const handleDeleteQuestion = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.clientId !== clientId)
        .map((q, i) => ({ ...q, order: i })),
    }));
  };

  const handleUpdateQuestion = (updated: QuestionState) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.clientId === updated.clientId ? updated : q
      ),
    }));
  };

  const handleSave = async (status: "DRAFT" | "ACTIVE") => {
    if (status === "ACTIVE" && form.questions.length < 3) {
      toast({
        title: t("builder.minQuestions"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const input: SaveFormInput = {
        id: form.id,
        title: form.title || t("builder.titlePlaceholder"),
        description: form.description || undefined,
        status,
        rateLimitMode: form.rateLimitMode,
        rateLimitHours: form.rateLimitHours,
        questions: form.questions.map((q) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          options: q.options.length > 0 ? q.options : undefined,
          order: q.order,
          required: q.required,
          hasBranching: q.hasBranching,
          followUpRules: q.followUpRules,
        })),
      };

      const result = await saveForm(input);

      if (status === "DRAFT") {
        toast({ title: "Brouillon sauvegard\u00e9" });
        if (!form.id) {
          router.replace(`/dashboard/forms/${result.id}/edit`);
        }
      } else {
        toast({ title: "Formulaire publi\u00e9 !" });
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
            disabled
          />
          <Button
            disabled
            className="bg-gradient-to-r from-[#6C5CE7] to-[#00B894] text-white opacity-50 cursor-not-allowed"
          >
            &#10024; G&eacute;n&eacute;rer
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            ou construisez manuellement
          </span>
          <Separator className="flex-1" />
        </div>
      </section>

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
                  onUpdate={handleUpdateQuestion}
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

  const previewContent = (
    <div className="flex items-start justify-center py-6">
      <MobilePreview form={form} />
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
            {t("builder.saveDraft")}
          </Button>
          <Button
            onClick={() => handleSave("ACTIVE")}
            disabled={saving}
            className="bg-[#6C5CE7] hover:bg-[#5A4BD5] text-white"
          >
            {t("builder.publish")}
          </Button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex-1 flex flex-col">
        <Tabs defaultValue="edit" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 mb-0">
            <TabsTrigger value="edit">{t("builder.edit")}</TabsTrigger>
            <TabsTrigger value="preview">{t("builder.preview")}</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="flex-1 overflow-y-auto p-4">
            {editorContent}
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
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          {editorContent}
        </div>
        <div className="w-[340px] border-l border-border bg-gray-50 overflow-y-auto shrink-0">
          <p className="text-xs text-center text-muted-foreground pt-4 pb-2">
            {t("builder.preview")}
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
