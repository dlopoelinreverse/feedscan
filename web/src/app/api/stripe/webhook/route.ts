import { NextResponse } from "next/server";
import { getStripe, STRIPE_PRO_PRICE_ID, STRIPE_BUSINESS_PRICE_ID } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { PlanType } from "@prisma/client";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const lineItems = await getStripe().checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      let plan: PlanType = "PRO";
      if (priceId === STRIPE_BUSINESS_PRICE_ID) {
        plan = "BUSINESS";
      } else if (priceId === STRIPE_PRO_PRICE_ID) {
        plan = "PRO";
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          stripeCustomerId: session.customer as string,
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price?.id;

      let plan: PlanType = "PRO";
      if (priceId === STRIPE_BUSINESS_PRICE_ID) {
        plan = "BUSINESS";
      } else if (priceId === STRIPE_PRO_PRICE_ID) {
        plan = "PRO";
      }

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: "FREE" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.error("Payment failed for customer:", invoice.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
