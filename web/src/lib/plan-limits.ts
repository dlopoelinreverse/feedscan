import { prisma } from "@/lib/prisma";
import type { FormStatus, PlanType } from "@prisma/client";

interface UserWithPlan {
  id: string;
  plan: PlanType;
  aiGenerationsUsed: number;
}

// Statuses that occupy a slot against the plan's form quota.
// DRAFT and ARCHIVED do not consume a slot.
export const COUNTED_FORM_STATUSES: FormStatus[] = ["ACTIVE"];

export interface PlanLimits {
  maxForms: number | null;
  maxResponsesPerMonth: number | null;
  maxAiGenerations: number | null;
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  if (plan === "FREE") {
    return { maxForms: 1, maxResponsesPerMonth: 50, maxAiGenerations: 3 };
  }
  return { maxForms: null, maxResponsesPerMonth: null, maxAiGenerations: null };
}

async function countCountedForms(userId: string): Promise<number> {
  return prisma.form.count({
    where: { userId, status: { in: COUNTED_FORM_STATUSES } },
  });
}

export async function canPublishForm(user: UserWithPlan): Promise<boolean> {
  if (user.plan !== "FREE") return true;
  const count = await countCountedForms(user.id);
  return count < 1;
}

export async function canReceiveResponse(user: UserWithPlan): Promise<boolean> {
  if (user.plan !== "FREE") return true;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const count = await prisma.response.count({
    where: {
      form: { userId: user.id },
      createdAt: { gte: startOfMonth },
    },
  });
  return count < 50;
}

export function canUseAI(user: UserWithPlan): boolean {
  if (user.plan !== "FREE") return true;
  return user.aiGenerationsUsed < 3;
}

export async function getRemainingResponses(
  user: UserWithPlan
): Promise<{ used: number; limit: number | null }> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const used = await prisma.response.count({
    where: {
      form: { userId: user.id },
      createdAt: { gte: startOfMonth },
    },
  });
  return {
    used,
    limit: user.plan === "FREE" ? 50 : null,
  };
}

export function getRemainingAI(
  user: UserWithPlan
): { used: number; limit: number | null } {
  return {
    used: user.aiGenerationsUsed,
    limit: user.plan === "FREE" ? 3 : null,
  };
}

export async function getFormCount(
  user: UserWithPlan
): Promise<{ count: number; limit: number | null }> {
  const count = await countCountedForms(user.id);
  return {
    count,
    limit: user.plan === "FREE" ? 1 : null,
  };
}
