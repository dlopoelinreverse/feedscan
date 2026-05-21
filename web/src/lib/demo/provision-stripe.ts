import "server-only";

import {
  getStripe,
  STRIPE_PRO_PRICE_ID,
  periodEndFromSubscription,
} from "@/lib/stripe";

export interface DemoStripeProvision {
  customerId: string;
  subscriptionId: string;
  currentPeriodEnd: Date | null;
}

// Stripe-provided test payment method that succeeds without 3DS.
const TEST_PAYMENT_METHOD = "pm_card_visa";

function assertTestMode(): void {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  // Hard safety: never touch Stripe in live mode for demo accounts.
  if (key.startsWith("sk_live_")) {
    throw new Error(
      "[demo/stripe] Refusing to provision: STRIPE_SECRET_KEY is a LIVE key"
    );
  }
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "[demo/stripe] STRIPE_SECRET_KEY missing or not a test key (must start with sk_test_)"
    );
  }
}

export function isDemoStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_") && Boolean(STRIPE_PRO_PRICE_ID);
}

export async function provisionDemoStripeSubscription(params: {
  email: string;
  name: string;
  expiresAt: Date;
}): Promise<DemoStripeProvision> {
  assertTestMode();
  if (!STRIPE_PRO_PRICE_ID) {
    throw new Error("[demo/stripe] STRIPE_PRO_PRICE_ID is not set");
  }

  const stripe = getStripe();
  let customerId: string | null = null;

  try {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        demoAccount: "true",
        expiresAt: params.expiresAt.toISOString(),
      },
    });
    customerId = customer.id;

    const paymentMethod = await stripe.paymentMethods.attach(
      TEST_PAYMENT_METHOD,
      { customer: customer.id }
    );
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: STRIPE_PRO_PRICE_ID }],
      default_payment_method: paymentMethod.id,
      metadata: { demoAccount: "true" },
      expand: ["latest_invoice.payment_intent"],
    });

    return {
      customerId: customer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: periodEndFromSubscription(subscription),
    };
  } catch (err) {
    // Best-effort rollback of the orphan customer if subscription creation
    // failed mid-flight — keeps the test dashboard clean.
    if (customerId) {
      try {
        await stripe.customers.del(customerId);
      } catch (cleanupErr) {
        console.warn(
          `[demo/stripe] rollback customer.del failed for ${customerId}:`,
          (cleanupErr as Error).message
        );
      }
    }
    throw err;
  }
}

export async function teardownDemoStripe(params: {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  userIdForLogs: string;
}): Promise<void> {
  const { stripeCustomerId, stripeSubscriptionId, userIdForLogs } = params;
  if (!stripeCustomerId && !stripeSubscriptionId) return;

  // If the env is misconfigured we can't talk to Stripe — bail out loudly but
  // do not block DB cleanup.
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (key.startsWith("sk_live_")) {
    console.error(
      `[demo/stripe] Refusing teardown for ${userIdForLogs}: STRIPE_SECRET_KEY is a LIVE key`
    );
    return;
  }
  if (!key.startsWith("sk_test_")) {
    console.warn(
      `[demo/stripe] Skipping teardown for ${userIdForLogs}: STRIPE_SECRET_KEY not a test key`
    );
    return;
  }

  const stripe = getStripe();

  if (stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
      console.log(
        `[demo/stripe] canceled subscription ${stripeSubscriptionId} for ${userIdForLogs}`
      );
    } catch (err) {
      // Idempotent: already canceled / not found is fine.
      console.warn(
        `[demo/stripe] subscriptions.cancel failed for ${stripeSubscriptionId} (${userIdForLogs}):`,
        (err as Error).message
      );
    }
  }

  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
      console.log(
        `[demo/stripe] deleted customer ${stripeCustomerId} for ${userIdForLogs}`
      );
    } catch (err) {
      console.warn(
        `[demo/stripe] customers.del failed for ${stripeCustomerId} (${userIdForLogs}):`,
        (err as Error).message
      );
    }
  }
}
