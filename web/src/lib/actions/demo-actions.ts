"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { seedDemoAccount } from "@/lib/demo/seed-demo-account";
import {
  isDemoStripeConfigured,
  provisionDemoStripeSubscription,
  teardownDemoStripe,
  type DemoStripeProvision,
} from "@/lib/demo/provision-stripe";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEMO_TTL_HOURS = 24;

const ipHits = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  for (const [key, ts] of ipHits) {
    if (now - ts > RATE_LIMIT_WINDOW_MS) ipHits.delete(key);
  }
  const last = ipHits.get(ip);
  if (last && now - last < RATE_LIMIT_WINDOW_MS) return false;
  ipHits.set(ip, now);
  return true;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function createAndSignInDemoAccount(): Promise<void> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) {
    throw new Error("rate_limited");
  }

  const email = `demo-${nanoid(10)}@feedscan.demo`;
  const password = nanoid(24);
  const expiresAt = new Date(Date.now() + DEMO_TTL_HOURS * 60 * 60 * 1000);

  const admin = getSupabaseAdmin();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created.user) {
    console.error("[demo] createUser failed:", createErr?.message);
    throw new Error("demo_create_failed");
  }

  const authUserId = created.user.id;

  // Provision a real (test-mode) Stripe customer + Pro subscription before we
  // persist the DB row, so the demo lands with a fully working billing state
  // (Stripe Customer Portal accessible, plan = Pro). Skipped silently if Stripe
  // is not configured in this environment — the demo still works, just without
  // a portal session.
  let stripeProvision: DemoStripeProvision | null = null;
  if (isDemoStripeConfigured()) {
    try {
      stripeProvision = await provisionDemoStripeSubscription({
        email,
        name: "Demo user",
        expiresAt,
      });
      console.log(
        `[demo] provisioned Stripe customer ${stripeProvision.customerId} + subscription ${stripeProvision.subscriptionId} for ${email}`
      );
    } catch (stripeErr) {
      console.error("[demo] Stripe provisioning failed:", stripeErr);
      try {
        await admin.auth.admin.deleteUser(authUserId);
      } catch (cleanupErr) {
        console.error("[demo] cleanup deleteUser failed:", cleanupErr);
      }
      throw new Error("demo_stripe_failed");
    }
  } else {
    console.warn(
      "[demo] Stripe not configured (sk_test_ key + STRIPE_PRO_PRICE_ID required); demo will have no Stripe customer"
    );
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.create({
          data: {
            id: authUserId,
            email,
            name: "Demo user",
            businessName: "Café Démo",
            businessType: "restaurant",
            plan: "PRO",
            isDemo: true,
            expiresAt,
            stripeCustomerId: stripeProvision?.customerId ?? null,
            stripeSubscriptionId: stripeProvision?.subscriptionId ?? null,
            stripeCurrentPeriodEnd: stripeProvision?.currentPeriodEnd ?? null,
          },
        });
        await seedDemoAccount(authUserId, tx);
      },
      { maxWait: 5000, timeout: 30000 }
    );
  } catch (err) {
    console.error("[demo] seed transaction failed:", err);
    try {
      await admin.auth.admin.deleteUser(authUserId);
    } catch (cleanupErr) {
      console.error("[demo] cleanup deleteUser failed:", cleanupErr);
    }
    if (stripeProvision) {
      await teardownDemoStripe({
        stripeCustomerId: stripeProvision.customerId,
        stripeSubscriptionId: stripeProvision.subscriptionId,
        userIdForLogs: authUserId,
      });
    }
    throw new Error("demo_seed_failed");
  }

  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    console.error("[demo] signIn failed:", signInErr.message);
    throw new Error("demo_signin_failed");
  }

  redirect("/dashboard");
}
