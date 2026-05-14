import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL } from "@/lib/ai/client";
import {
  analyzeBusinessRequestSchema,
  analyzeBusinessResponseSchema,
} from "@/lib/ai/schemas";
import {
  buildAnalyzeBusinessSystemPrompt,
  buildAnalyzeBusinessUserMessage,
} from "@/lib/ai/prompts";
import { canUseAI } from "@/lib/plan-limits";
import { generateSlug } from "@/lib/utils";

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
    return NextResponse.json({ error: "AI_LIMIT_REACHED" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = analyzeBusinessRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { formId, businessName, businessType, description, locale } =
    parsed.data;

  let resolvedFormId = formId;
  if (resolvedFormId) {
    const existing = await prisma.form.findFirst({
      where: { id: resolvedFormId, userId: user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
  } else {
    const draft = await prisma.form.create({
      data: {
        userId: user.id,
        title: businessName,
        titleFr: businessName,
        slug: generateSlug(),
        status: "DRAFT",
      },
      select: { id: true },
    });
    resolvedFormId = draft.id;
  }

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: buildAnalyzeBusinessSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildAnalyzeBusinessUserMessage({
            businessName,
            businessType,
            description,
            locale,
          }),
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI did not return valid JSON" },
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    const validated = analyzeBusinessResponseSchema.safeParse(aiResult);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "AI response validation failed",
          details: validated.error.issues,
        },
        { status: 500 }
      );
    }

    const businessContext = { businessName, businessType, description, locale };

    const conversation = await prisma.aiConversation.upsert({
      where: { formId: resolvedFormId },
      create: {
        formId: resolvedFormId,
        userId: user.id,
        phase: "angles",
        businessContext,
        proposedAngles: validated.data.angles,
      },
      update: {
        phase: "angles",
        businessContext,
        proposedAngles: validated.data.angles,
        selectedAngles: Prisma.JsonNull,
        generatedForm: Prisma.JsonNull,
      },
      select: { id: true },
    });

    return NextResponse.json({
      formId: resolvedFormId,
      conversationId: conversation.id,
      angles: validated.data.angles,
    });
  } catch (err) {
    console.error("AI analyze-business error:", err);
    return NextResponse.json(
      { error: "AI analysis failed" },
      { status: 500 }
    );
  }
}
