<<<<<<< HEAD
import { prisma } from "@/lib/prisma";
import { handleOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

interface AnswerPayload {
  value: number | string | string[];
  followUp?: {
    ruleId: string;
    selected: string[];
    freeText?: string;
  };
}

interface ResponseInput {
  formId: string;
  qrCodeId: string | null;
  visitorId: string;
  answers: Record<string, AnswerPayload>;
  metadata: {
    userAgent: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
  };
}
=======
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canReceiveResponse } from "@/lib/plan-limits";
import { getAppUrl } from "@/lib/domains";
>>>>>>> test/stripe-integration

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResponseInput;
    const { formId, qrCodeId, visitorId, answers, metadata } = body;

<<<<<<< HEAD
    if (!formId || !answers || !visitorId) {
      return jsonWithCors(
        request,
        { error: "formId, visitorId, and answers are required" },
        { status: 400 }
      );
    }

    // Verify form is ACTIVE
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, status: true, rateLimitMode: true, rateLimitHours: true },
    });

    if (!form || form.status !== "ACTIVE") {
      return jsonWithCors(
        request,
        { error: "Form not available" },
        { status: 404 }
      );
    }

    // Rate limiting (server-side enforcement for PER_24H / PER_WEEK / CUSTOM)
    if (form.rateLimitMode !== "NONE" && form.rateLimitMode !== "PER_SESSION") {
      const since = new Date();
      if (form.rateLimitMode === "PER_24H") {
        since.setHours(since.getHours() - 24);
      } else if (form.rateLimitMode === "PER_WEEK") {
        since.setDate(since.getDate() - 7);
      } else if (form.rateLimitMode === "CUSTOM" && form.rateLimitHours) {
        since.setHours(since.getHours() - form.rateLimitHours);
      }

      const existing = await prisma.response.findFirst({
        where: {
          formId,
          visitorId,
          createdAt: { gte: since },
        },
      });

      if (existing) {
        return jsonWithCors(
          request,
          { error: "Already responded", alreadyResponded: true },
          { status: 409 }
        );
      }
    }

    // Transaction: response + counters
    const result = await prisma.$transaction(async (tx) => {
      const response = await tx.response.create({
        data: {
          formId,
          qrCodeId: qrCodeId ?? null,
          visitorId,
          answers: answers as object,
          metadata: metadata as object,
        },
      });

      if (qrCodeId) {
        await tx.qRCode.update({
          where: { id: qrCodeId },
          data: { scans: { increment: 1 } },
        });
      }

      await tx.visitor.update({
        where: { id: visitorId },
        data: {
          responseCount: { increment: 1 },
          lastSeenAt: new Date(),
        },
      });

      return response;
    });

    const res = jsonWithCors(
      request,
      { success: true, id: result.id },
      { status: 201 }
    );

    // Set visitor cookie (1 year)
    const isDev =
      process.env.NODE_ENV === "development" ||
      !process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
      process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes("localhost");

    const cookieParts = [
      `fs_vid=${visitorId}`,
      "Path=/",
      "Max-Age=31536000",
      "SameSite=Lax",
      "HttpOnly",
    ];
    if (!isDev && process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
      cookieParts.push(`Domain=.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
      cookieParts.push("Secure");
    }
    res.headers.append("Set-Cookie", cookieParts.join("; "));

    return res;
  } catch (err) {
    console.error("responses POST error", err);
    return jsonWithCors(
      request,
      { error: "Internal error" },
      { status: 500 }
    );
  }
=======
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
>>>>>>> test/stripe-integration
}
