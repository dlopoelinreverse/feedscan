import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  planFromSubscription,
  periodEndFromSubscription,
} from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";

export const runtime = "nodejs";

interface SyncFromSubscriptionArgs {
  subscription: Stripe.Subscription;
  userId?: string | null;
  customerId?: string | null;
}

async function syncUserFromSubscription({
  subscription,
  userId,
  customerId,
}: SyncFromSubscriptionArgs): Promise<void> {
  const plan: PlanType = planFromSubscription(subscription);
  const periodEnd = periodEndFromSubscription(subscription);

  // Demo accounts are sacred: we never let Stripe events overwrite them.
  const where = userId
    ? { id: userId, isDemo: false }
    : customerId
    ? { stripeCustomerId: customerId, isDemo: false }
    : null;

  if (!where) return;

  await prisma.user.updateMany({
    where,
    data: {
      plan,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripeCurrentPeriodEnd: periodEnd,
    },
  });
}

async function downgradeByCustomer(customerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId, isDemo: false },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      stripeCurrentPeriodEnd: null,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? null;
        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        if (!subscriptionId) break;

        const subscription = await getStripe().subscriptions.retrieve(
          subscriptionId,
          { expand: ["items.data.price"] }
        );

        await syncUserFromSubscription({
          subscription,
          userId,
          customerId,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const userId = subscription.metadata?.userId ?? null;

        await syncUserFromSubscription({
          subscription,
          userId,
          customerId,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await downgradeByCustomer(customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;
        if (customerId) {
          await downgradeByCustomer(customerId);
        }
        break;
      }

      default:
        // Acknowledge unhandled events so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
