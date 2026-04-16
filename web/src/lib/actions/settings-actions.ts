"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/stripe";
import { getFormCount, getRemainingResponses, getRemainingAI } from "@/lib/plan-limits";

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getSettingsData() {
  const userId = await getAuthUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      businessName: true,
      businessType: true,
      plan: true,
      stripeCustomerId: true,
      aiGenerationsUsed: true,
    },
  });

  const [formCount, responses, ai] = await Promise.all([
    getFormCount(user),
    getRemainingResponses(user),
    getRemainingAI(user),
  ]);

  let subscription: {
    renewalDate: string | null;
    cardLast4: string | null;
  } = { renewalDate: null, cardLast4: null };

  if (user.stripeCustomerId && user.plan !== "FREE") {
    try {
      const sub = await getSubscription(user.stripeCustomerId);
      if (sub) {
        subscription.renewalDate = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        const pm = sub.default_payment_method;
        if (pm && typeof pm === "object" && "card" in pm) {
          subscription.cardLast4 = (pm as { card?: { last4?: string } }).card?.last4 ?? null;
        }
      }
    } catch {
      // Stripe not configured or error — ignore
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      businessType: user.businessType,
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
    },
    subscription,
    usage: {
      forms: formCount,
      responses,
      ai,
    },
  };
}

export async function updateProfile(data: {
  businessName: string;
  businessType: string;
}) {
  const userId = await getAuthUserId();
  await prisma.user.update({
    where: { id: userId },
    data: {
      businessName: data.businessName,
      businessType: data.businessType,
    },
  });
  return { success: true };
}

export async function deleteAccount() {
  const userId = await getAuthUserId();
  const supabase = await createClient();

  // Delete from Prisma (cascades to forms, responses, etc.)
  await prisma.user.delete({ where: { id: userId } });

  // Sign out from Supabase
  await supabase.auth.signOut();

  return { success: true };
}
