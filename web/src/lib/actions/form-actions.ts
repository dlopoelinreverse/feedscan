"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

type FormStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type RateLimitMode = "NONE" | "PER_SESSION" | "PER_24H" | "PER_WEEK" | "CUSTOM";
type Tx = Prisma.TransactionClient;

export interface QuestionInput {
  id?: string;
  type: "STARS" | "EMOJI" | "CHOICE" | "TEXT";
  label: string;
  options?: string[];
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
  followUpOptions: string[];
  allowFreeText: boolean;
  enabled?: boolean;
  allowOptions?: boolean;
}

export interface SaveFormInput {
  id?: string;
  title: string;
  description?: string;
  status: FormStatus;
  rateLimitMode: RateLimitMode;
  rateLimitHours?: number;
  questions: QuestionInput[];
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

  const result = await prisma.$transaction(async (tx: Tx) => {
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

      form = await tx.form.update({
        where: { id: input.id },
        data: {
          title: input.title,
          titleFr: input.title,
          description: input.description,
          descriptionFr: input.description,
          status: input.status,
          rateLimitMode: input.rateLimitMode,
          rateLimitHours: input.rateLimitHours,
          slug:
            input.status === "ACTIVE" && !existing.slug
              ? generateSlug()
              : existing.slug,
        },
      });

      // Delete existing questions (cascade deletes followUpRules)
      await tx.question.deleteMany({ where: { formId: form.id } });
    } else {
      // Check plan limit for FREE
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });
      if (user?.plan === "FREE") {
        const count = await tx.form.count({ where: { userId } });
        if (count >= 1) {
          throw new Error("PLAN_LIMIT");
        }
      }

      form = await tx.form.create({
        data: {
          userId,
          title: input.title,
          titleFr: input.title,
          description: input.description,
          descriptionFr: input.description,
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
          labelFr: q.label,
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
            followUpLabelFr: rule.followUpLabel,
            followUpOptions: rule.followUpOptions,
            followUpOptionsFr: rule.followUpOptions,
            allowFreeText: rule.allowFreeText,
          },
        });
      }
    }

    return form;
  });

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
