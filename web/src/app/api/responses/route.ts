import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canReceiveResponse } from "@/lib/plan-limits";
import { getAppUrl } from "@/lib/domains";

export async function POST(request: Request) {
  const body = await request.json();
  const { formId, answers, metadata } = body;

  if (!formId || !answers) {
    return NextResponse.json(
      { error: "formId and answers are required" },
      { status: 400 }
    );
  }

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: { userId: true, status: true },
  });

  if (!form || form.status !== "ACTIVE") {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  // Check plan limits
  const user = await prisma.user.findUnique({
    where: { id: form.userId },
    select: { id: true, plan: true, aiGenerationsUsed: true },
  });

  if (user) {
    const allowed = await canReceiveResponse(user);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "plan_limit",
          limit: "responses",
          message: "Monthly response limit reached",
          upgradeUrl: getAppUrl("/dashboard/settings"),
        },
        { status: 403 }
      );
    }
  }

  console.log("Response received for form", formId, metadata);

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");

  if (!formId) {
    return NextResponse.json({ error: "formId is required" }, { status: 400 });
  }

  return NextResponse.json({ responses: [] });
}
