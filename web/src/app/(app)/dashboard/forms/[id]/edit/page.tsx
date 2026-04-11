import { notFound } from "next/navigation";
import { getFormById, getUserProfile } from "@/lib/actions/form-actions";
import { FormBuilder } from "@/components/forms/form-builder";
import { nanoid } from "nanoid";
import type { FormBuilderState, QuestionState, FollowUpRuleState, QuestionType } from "@/components/forms/types";

interface FormEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormEditPage({ params }: FormEditPageProps) {
  const { id } = await params;
  const [form, userProfile] = await Promise.all([
    getFormById(id),
    getUserProfile(),
  ]);

  if (!form) {
    notFound();
  }

  const initialData: FormBuilderState = {
    id: form.id,
    title: form.title,
    titleFr: form.titleFr || undefined,
    titleEn: form.titleEn || undefined,
    description: form.description ?? "",
    descriptionFr: form.descriptionFr || undefined,
    descriptionEn: form.descriptionEn || undefined,
    status: form.status,
    rateLimitMode: form.rateLimitMode,
    rateLimitHours: form.rateLimitHours ?? undefined,
    questions: form.questions.map(
      (q: {
        id: string;
        type: string;
        label: string;
        labelFr: string;
        labelEn: string | null;
        options: unknown;
        order: number;
        required: boolean;
        hasBranching: boolean;
        followUpRules: Array<{
          id: string;
          triggerType: string;
          triggerMin: number;
          triggerMax: number;
          followUpLabel: string;
          followUpLabelFr: string;
          followUpLabelEn: string | null;
          followUpOptions: unknown;
          followUpOptionsFr: unknown;
          followUpOptionsEn: unknown;
          allowFreeText: boolean;
        }>;
      }): QuestionState => ({
        clientId: nanoid(),
        id: q.id,
        type: q.type as QuestionType,
        label: q.label,
        labelFr: q.labelFr || undefined,
        labelEn: q.labelEn || undefined,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        order: q.order,
        required: q.required,
        hasBranching: q.hasBranching,
        followUpRules: q.followUpRules.map(
          (r): FollowUpRuleState => {
            const opts = Array.isArray(r.followUpOptions)
              ? (r.followUpOptions as string[])
              : [];
            return {
              id: r.id,
              triggerType: r.triggerType as "LOW" | "HIGH",
              triggerMin: r.triggerMin,
              triggerMax: r.triggerMax,
              followUpLabel: r.followUpLabel,
              followUpLabelFr: r.followUpLabelFr || undefined,
              followUpLabelEn: r.followUpLabelEn || undefined,
              followUpOptions: opts,
              followUpOptionsFr: Array.isArray(r.followUpOptionsFr)
                ? (r.followUpOptionsFr as string[])
                : undefined,
              followUpOptionsEn: Array.isArray(r.followUpOptionsEn)
                ? (r.followUpOptionsEn as string[])
                : undefined,
              allowFreeText: r.allowFreeText,
              enabled: true,
              allowOptions: opts.length > 0,
            };
          }
        ),
      })
    ),
  };

  return (
    <div className="h-[calc(100vh-49px)] md:h-screen flex flex-col">
      <FormBuilder initialData={initialData} userProfile={userProfile ?? undefined} />
    </div>
  );
}
