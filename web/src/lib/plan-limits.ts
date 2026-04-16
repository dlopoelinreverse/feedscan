import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";

interface UserWithPlan {
  id: string;
  plan: PlanType;
  aiGenerationsUsed: number;
}

export async function canCreateForm(user: UserWithPlan): Promise<boolean> {
  if (user.plan !== "FREE") return true;
  const count = await prisma.form.count({ where: { userId: user.id } });
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
  const count = await prisma.form.count({ where: { userId: user.id } });
  return {
    count,
    limit: user.plan === "FREE" ? 1 : null,
  };
}
