import Stripe from "stripe";
import type { PlanType } from "@prisma/client";
import { getAbsoluteAppUrl } from "@/lib/domains";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const STRIPE_BUSINESS_PRICE_ID = process.env.STRIPE_BUSINESS_PRICE_ID ?? "";

export function planFromPriceId(
  priceId: string | null | undefined
): PlanType {
  if (priceId && priceId === STRIPE_PRO_PRICE_ID) return "PRO";
  if (priceId && priceId === STRIPE_BUSINESS_PRICE_ID) return "BUSINESS";
  return "FREE";
}

// Subscription statuses that should drop the user back to FREE.
const DOWNGRADE_STATUSES: ReadonlyArray<Stripe.Subscription.Status> = [
  "canceled",
  "unpaid",
  "incomplete_expired",
];

export function planFromSubscription(
  subscription: Stripe.Subscription
): PlanType {
  if (DOWNGRADE_STATUSES.includes(subscription.status)) return "FREE";
  const priceId = subscription.items.data[0]?.price?.id;
  return planFromPriceId(priceId);
}

export function periodEndFromSubscription(
  subscription: Stripe.Subscription
): Date | null {
  const item = subscription.items.data[0];
  // Newer API versions expose current_period_end on the subscription item;
  // older ones on the subscription itself. Be defensive.
  const ts =
    (item as { current_period_end?: number } | undefined)?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000) : null;
}

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
}: {
  customerId: string;
  priceId: string;
  userId: string;
}) {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: getAbsoluteAppUrl(
      "/dashboard/settings?stripe_session_id={CHECKOUT_SESSION_ID}"
    ),
    cancel_url: getAbsoluteAppUrl("/dashboard/settings?stripe_canceled=1"),
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });
}

export async function createPortalSession(customerId: string) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: getAbsoluteAppUrl("/dashboard/settings"),
  });
}

export async function getSubscription(customerId: string) {
  const subscriptions = await getStripe().subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
    expand: ["data.default_payment_method", "data.items.data.price"],
  });
  return subscriptions.data[0] ?? null;
}
