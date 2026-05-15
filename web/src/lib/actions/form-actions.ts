"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";
import { canCreateForm } from "@/lib/plan-limits";
import { PRESETS } from "@/lib/themes/presets";
import type { Prisma } from "@prisma/client";

type FormStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type RateLimitMode = "NONE" | "PER_SESSION" | "PER_24H" | "PER_WEEK" | "CUSTOM";
type Tx = Prisma.TransactionClient;

export interface QuestionInput {
  id?: string;
  type: "STARS" | "EMOJI" | "CHOICE" | "TEXT";
  label: string;
  labelFr?: string;
  labelEn?: string;
  options?: string[];
  optionsFr?: string[];
  optionsEn?: string[];
  order: number;
  required: boolean;
  hasBranching: boolean;
  followUpRules: FollowUpRuleInput[];
}

export interface FollowUpRuleInput {
  id?: string;
  triggerType: "LOW" | "HIGH";
  triggerMin: number;
  triggerMax: number;
  followUpLabel: string;
  followUpLabelFr?: string;
  followUpLabelEn?: string;
  followUpOptions: string[];
  followUpOptionsFr?: string[];
  followUpOptionsEn?: string[];
  allowFreeText: boolean;
  enabled?: boolean;
  allowOptions?: boolean;
}

export interface SaveFormInput {
  id?: string;
  title: string;
  titleFr?: string;
  titleEn?: string;
  description?: string;
  descriptionFr?: string;
  descriptionEn?: string;
  status: FormStatus;
  rateLimitMode: RateLimitMode;
  rateLimitHours?: number;
  themeId?: string | null;
  questions: QuestionInput[];
}

async function ensureDefaultThemeTx(
  tx: Tx,
  userId: string
): Promise<{ id: string }> {
  const existing = await tx.theme.findFirst({
    where: { userId, isDefault: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing;

  const any = await tx.theme.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (any) {
    await tx.theme.update({
      where: { id: any.id },
      data: { isDefault: true },
    });
    return any;
  }

  const created = await tx.theme.create({
    data: {
      userId,
      name: "Mon premier thème",
      config: PRESETS.minimal as unknown as object,
      isDefault: true,
    },
    select: { id: true },
  });
  return created;
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function saveForm(input: SaveFormInput) {
  const userId = await getAuthUserId();

  const result = await prisma.$transaction(
    async (tx: Tx) => {
    let form;

    if (input.id) {
      // Verify ownership
      const existing = await tx.form.findUnique({
        where: { id: input.id },
        select: { userId: true, slug: true },
      });
      if (!existing || existing.userId !== userId) {
        throw new Error("Form not found");
      }

      let themeIdToApply: string | undefined | null = undefined;
      if (input.themeId !== undefined) {
        if (input.themeId === null) {
          themeIdToApply = null;
        } else {
          const t = await tx.theme.findUnique({
            where: { id: input.themeId },
            select: { userId: true },
          });
          if (!t || t.userId !== userId) {
            throw new Error("Theme not found");
          }
          themeIdToApply = input.themeId;
        }
      }

      form = await tx.form.update({
        where: { id: input.id },
        data: {
          title: input.title,
          titleFr: input.titleFr || input.title,
          titleEn: input.titleEn || undefined,
          description: input.description,
          descriptionFr: input.descriptionFr || input.description,
          descriptionEn: input.descriptionEn || undefined,
          status: input.status,
          rateLimitMode: input.rateLimitMode,
          rateLimitHours: input.rateLimitHours,
          slug:
            input.status === "ACTIVE" && !existing.slug
              ? generateSlug()
              : existing.slug,
          ...(themeIdToApply !== undefined ? { themeId: themeIdToApply } : {}),
        },
      });

      // Delete existing questions (cascade deletes followUpRules)
      await tx.question.deleteMany({ where: { formId: form.id } });
    } else {
      // Check plan limit
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, plan: true, aiGenerationsUsed: true },
      });
      if (user) {
        const allowed = await canCreateForm(user);
        if (!allowed) {
          throw new Error("PLAN_LIMIT");
        }
      }

      const defaultTheme = await ensureDefaultThemeTx(tx, userId);
      const requestedThemeId =
        input.themeId !== undefined && input.themeId !== null
          ? await (async () => {
              const t = await tx.theme.findUnique({
                where: { id: input.themeId as string },
                select: { userId: true },
              });
              if (!t || t.userId !== userId) {
                throw new Error("Theme not found");
              }
              return input.themeId as string;
            })()
          : defaultTheme.id;

      form = await tx.form.create({
        data: {
          userId,
          themeId: requestedThemeId,
          title: input.title,
          titleFr: input.titleFr || input.title,
          titleEn: input.titleEn || undefined,
          description: input.description,
          descriptionFr: input.descriptionFr || input.description,
          descriptionEn: input.descriptionEn || undefined,
          status: input.status,
          slug: input.status === "ACTIVE" ? generateSlug() : generateSlug(),
          rateLimitMode: input.rateLimitMode,
          rateLimitHours: input.rateLimitHours,
        },
      });
    }

    // Create questions
    for (const q of input.questions) {
      const question = await tx.question.create({
        data: {
          formId: form.id,
          type: q.type,
          label: q.label,
          labelFr: q.labelFr || q.label,
          labelEn: q.labelEn || undefined,
          options: q.options ?? [],
          order: q.order,
          required: q.required,
          hasBranching: q.hasBranching,
        },
      });

      // Create follow-up rules
      for (const rule of q.followUpRules) {
        await tx.followUpRule.create({
          data: {
            questionId: question.id,
            triggerType: rule.triggerType,
            triggerMin: rule.triggerMin,
            triggerMax: rule.triggerMax,
            followUpLabel: rule.followUpLabel,
            followUpLabelFr: rule.followUpLabelFr || rule.followUpLabel,
            followUpLabelEn: rule.followUpLabelEn || undefined,
            followUpOptions: rule.followUpOptions,
            followUpOptionsFr: rule.followUpOptionsFr || rule.followUpOptions,
            followUpOptionsEn: rule.followUpOptionsEn || undefined,
            allowFreeText: rule.allowFreeText,
          },
        });
      }
    }

      return form;
    },
    { maxWait: 5000, timeout: 30000 }
  );

  return { id: result.id, slug: result.slug };
}

export async function deleteForm(formId: string) {
  const userId = await getAuthUserId();

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { userId: true },
  });
  if (!form || form.userId !== userId) {
    throw new Error("Form not found");
  }

  await prisma.form.delete({ where: { id: formId } });
}

export async function getFormById(formId: string) {
  const userId = await getAuthUserId();

  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      questions: {
        include: { followUpRules: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!form || form.userId !== userId) {
    return null;
  }

  return form;
}

export async function getUserForms() {
  const userId = await getAuthUserId();

  return prisma.form.findMany({
    where: { userId },
    include: {
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserPlan() {
  const userId = await getAuthUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  return user?.plan ?? "FREE";
}

export async function getUserProfile() {
  const userId = await getAuthUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true, businessType: true },
  });

  return user;
}
