import { notFound } from "next/navigation";
import { getFormById } from "@/lib/actions/form-actions";
import { FormBuilder } from "@/components/forms/form-builder";
import { nanoid } from "nanoid";
import type { FormBuilderState, QuestionState, FollowUpRuleState, QuestionType } from "@/components/forms/types";

interface FormEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormEditPage({ params }: FormEditPageProps) {
  const { id } = await params;
  const form = await getFormById(id);

  if (!form) {
    notFound();
  }

  const initialData: FormBuilderState = {
    id: form.id,
    title: form.title,
    description: form.description ?? "",
    status: form.status,
    rateLimitMode: form.rateLimitMode,
    rateLimitHours: form.rateLimitHours ?? undefined,
    questions: form.questions.map(
      (q: { id: string; type: string; label: string; options: unknown; order: number; required: boolean; hasBranching: boolean; followUpRules: Array<{ id: string; triggerType: string; triggerMin: number; triggerMax: number; followUpLabel: string; followUpOptions: unknown; allowFreeText: boolean }> }): QuestionState => ({
        clientId: nanoid(),
        id: q.id,
        type: q.type as QuestionType,
        label: q.label,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        order: q.order,
        required: q.required,
        hasBranching: q.hasBranching,
        followUpRules: q.followUpRules.map(
          (r: { id: string; triggerType: string; triggerMin: number; triggerMax: number; followUpLabel: string; followUpOptions: unknown; allowFreeText: boolean }): FollowUpRuleState => ({
            id: r.id,
            triggerType: r.triggerType as "LOW" | "HIGH",
            triggerMin: r.triggerMin,
            triggerMax: r.triggerMax,
            followUpLabel: r.followUpLabel,
            followUpOptions: Array.isArray(r.followUpOptions)
              ? (r.followUpOptions as string[])
              : [],
            allowFreeText: r.allowFreeText,
          })
        ),
      })
    ),
  };

  return (
    <div className="h-[calc(100vh-49px)] md:h-screen flex flex-col">
      <FormBuilder initialData={initialData} />
    </div>
  );
}
