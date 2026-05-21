import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { teardownDemoStripe } from "@/lib/demo/provision-stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cleanup-demo] CRON_SECRET is not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const expired = await prisma.user.findMany({
    where: {
      isDemo: true,
      expiresAt: { lt: new Date() },
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  const admin = getSupabaseAdmin();
  let deleted = 0;
  for (const user of expired) {
    try {
      // Tear down Stripe first. Idempotent — failures are logged but never
      // block DB cleanup (the cron will retry the user otherwise).
      await teardownDemoStripe({
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        userIdForLogs: user.id,
      });

      const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
      if (authErr && !/not found/i.test(authErr.message)) {
        console.error(
          `[cron/cleanup-demo] auth delete failed for ${user.id}:`,
          authErr.message
        );
        continue;
      }
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`[cron/cleanup-demo] deleted demo user ${user.email} (${user.id})`);
      deleted++;
    } catch (err) {
      console.error(
        `[cron/cleanup-demo] failed to delete user ${user.id}:`,
        err
      );
    }
  }

  return NextResponse.json({ deleted });
}
