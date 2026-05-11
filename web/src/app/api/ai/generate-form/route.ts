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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limits
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, plan: true, aiGenerationsUsed: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!canUseAI(dbUser)) {
    return NextResponse.json(
      { error: "AI_LIMIT_REACHED" },
      { status: 429 }
    );
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = generateFormRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { businessName, businessType, targetAreas, description, specificRequest } = parsed.data;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      system: buildGenerateSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildGenerateUserMessage({
            businessName,
            businessType,
            targetAreas,
            description,
            specificRequest,
          }),
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse AI response as JSON
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
        { error: "AI response validation failed", details: validated.error.issues },
        { status: 500 }
      );
    }

    // Increment AI usage counter
    await prisma.user.update({
      where: { id: user.id },
      data: { aiGenerationsUsed: { increment: 1 } },
    });

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}
