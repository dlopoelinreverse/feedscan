import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, AI_MODEL } from "@/lib/ai/client";
import {
  translateFormRequestSchema,
  aiFormResponseSchema,
} from "@/lib/ai/schemas";
import { buildTranslateSystemPrompt } from "@/lib/ai/prompts";
import { aiGuard } from "@/lib/ai/guard";

export async function POST(request: Request) {
  const guard = await aiGuard(request, "translate-form");
  if (!guard.allowed) return guard.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = translateFormRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { form, sourceLang, targetLang } = parsed.data;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      system: buildTranslateSystemPrompt(sourceLang, targetLang),
      messages: [
        {
          role: "user",
          content: JSON.stringify(form, null, 2),
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
    const validated = aiFormResponseSchema.safeParse(aiResult);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Translation validation failed", details: validated.error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("AI translate error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
