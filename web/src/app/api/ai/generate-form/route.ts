import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { canUseAI } from "@/lib/plan-limits";
import { getAppUrl } from "@/lib/domains";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, plan: true, aiGenerationsUsed: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!canUseAI(dbUser)) {
    return NextResponse.json(
      {
        error: "plan_limit",
        limit: "ai",
        message: "AI generation limit reached",
        upgradeUrl: getAppUrl("/dashboard/settings"),
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { prompt } = body;

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  // TODO: implement AI form generation
  return NextResponse.json({ message: "AI generation coming soon" });
}
