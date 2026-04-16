import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createPortalSession } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found" },
      { status: 400 }
    );
  }

  const session = await createPortalSession(dbUser.stripeCustomerId);
  return NextResponse.json({ url: session.url });
}
