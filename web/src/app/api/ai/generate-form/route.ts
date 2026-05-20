import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { anthropic, AI_MODEL } from "@/lib/ai/client";
import {
  generateFormRequestSchema,
  aiFormResponseSchema,
} from "@/lib/ai/schemas";
import {
  buildGenerateSystemPrompt,
  buildGenerateUserMessage,
} from "@/lib/ai/prompts";
import { canUseAI } from "@/lib/plan-limits";
import { aiGuard } from "@/lib/ai/guard";

export async function POST(request: Request) {
  const guard = await aiGuard(request, "generate-form");
  if (!guard.allowed) return guard.response;

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
  const parsed = generateFormRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { formId, selectedAngles } = parsed.data;

  const conversation = await prisma.aiConversation.findUnique({
    where: { formId },
    select: { id: true, userId: true, businessContext: true },
  });

  if (!conversation || conversation.userId !== user.id) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const ctx = conversation.businessContext as {
    businessName: string;
    businessType: string;
    description?: string;
  };

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: buildGenerateSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: buildGenerateUserMessage({
            businessName: ctx.businessName,
            businessType: ctx.businessType,
            description: ctx.description,
            selectedAngles,
          }),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      console.error("AI generation truncated by max_tokens");
      return NextResponse.json(
        { error: "AI response truncated" },
        { status: 500 }
      );
    }

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
    const validated = aiFormResponseSchema.safeParse(aiResult);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "AI response validation failed",
          details: validated.error.issues,
        },
        { status: 500 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { aiGenerationsUsed: { increment: 1 } },
      }),
      prisma.aiConversation.update({
        where: { id: conversation.id },
        data: {
          phase: "chat",
          selectedAngles,
          generatedForm: validated.data,
        },
      }),
    ]);

    return NextResponse.json({ ...validated.data, formId });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}
