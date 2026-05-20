import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, AI_MODEL } from "@/lib/ai/client";
import {
  refineFormRequestSchema,
  refineFormResponseSchema,
} from "@/lib/ai/schemas";
import { buildRefineSystemPrompt } from "@/lib/ai/prompts";
import { aiGuard } from "@/lib/ai/guard";

export async function POST(request: Request) {
  const guard = await aiGuard(request, "refine-form");
  if (!guard.allowed) return guard.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = refineFormRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { currentForm, messages, userMessage, userLocale } = parsed.data;

  try {
    // Build conversation history for the AI
    const aiMessages: { role: "user" | "assistant"; content: string }[] = [
      {
        role: "user",
        content: `Current form:\n${JSON.stringify(currentForm, null, 2)}`,
      },
    ];

    // Add conversation history
    for (const msg of messages) {
      aiMessages.push({ role: msg.role, content: msg.content });
    }

    // Add the new user message
    aiMessages.push({ role: "user", content: userMessage });

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: buildRefineSystemPrompt(userLocale),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: aiMessages,
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
    const validated = refineFormResponseSchema.safeParse(aiResult);

    if (!validated.success) {
      return NextResponse.json(
        { error: "AI response validation failed", details: validated.error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...validated.data,
      suggestions: validated.data.suggestions ?? [],
    });
  } catch (err) {
    console.error("AI refine error:", err);
    return NextResponse.json(
      { error: "AI refinement failed" },
      { status: 500 }
    );
  }
}
