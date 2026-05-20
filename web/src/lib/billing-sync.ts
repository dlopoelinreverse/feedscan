import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  getStripe,
  planFromSubscription,
  periodEndFromSubscription,
} from "@/lib/stripe";
import type { PlanType } from "@prisma/client";

/**
 * Defensive sync called from the settings page when the user lands back from
 * Stripe Checkout. The webhook is the source of truth, but it can lag a few
 * seconds — this re-reads the session from Stripe and reconciles the user row
 * if the webhook hasn't caught up yet. Idempotent.
 *
 * Returns true if anything was applied (so the UI can refetch).
 */
export async function syncUserFromCheckoutSession({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<{ synced: boolean; plan: PlanType | null }> {
  // Never touch demo accounts, even if a session id happens to be present.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isDemo: true,
      plan: true,
      stripeSubscriptionId: true,
    },
  });
  if (!user || user.isDemo) return { synced: false, plan: null };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.items.data.price"],
    });
  } catch (err) {
    console.error("Defensive checkout sync: retrieve failed", err);
    return { synced: false, plan: null };
  }

  // Only act on a completed, paid session whose metadata matches this user.
  if (session.status !== "complete") return { synced: false, plan: null };
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { synced: false, plan: null };
  }
  if (session.metadata?.userId && session.metadata.userId !== userId) {
    return { synced: false, plan: null };
  }

  const subscription = session.subscription;
  if (!subscription || typeof subscription === "string") {
    return { synced: false, plan: null };
  }

  const plan = planFromSubscription(subscription);
  const periodEnd = periodEndFromSubscription(subscription);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  // Already up to date — skip the write.
  if (
    user.plan === plan &&
    user.stripeSubscriptionId === subscription.id
  ) {
    return { synced: false, plan };
  }

  await prisma.user.updateMany({
    where: { id: userId, isDemo: false },
    data: {
      plan,
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      stripeCurrentPeriodEnd: periodEnd,
    },
  });

  return { synced: true, plan };
}
