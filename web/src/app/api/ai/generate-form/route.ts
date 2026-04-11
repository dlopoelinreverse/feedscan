import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const GeneratedFormSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  questions: z
    .array(
      z.object({
        type: z.enum(["stars", "emoji", "choice", "text"]),
        label: z.string().min(1),
        options: z.array(z.string()).nullable(),
        required: z.boolean(),
        emojiLevels: z.number().nullable().optional(),
        branching: z
          .object({
            low: z.object({
              triggerMin: z.number(),
              triggerMax: z.number(),
              followUpLabel: z.string(),
              followUpOptions: z.array(z.string()),
              allowFreeText: z.boolean(),
            }),
            high: z.object({
              triggerMin: z.number(),
              triggerMax: z.number(),
              followUpLabel: z.string(),
              followUpOptions: z.array(z.string()),
              allowFreeText: z.boolean(),
            }),
          })
          .nullable(),
      })
    )
    .min(3)
    .max(5),
});

const SYSTEM_PROMPT = `Tu es un expert en satisfaction client pour les commerces physiques au Québec (Montréal).
L'utilisateur va décrire son commerce et ce qu'il veut mesurer.
Tu dois générer un formulaire de feedback client court et pertinent.

Règles strictes :
- Génère entre 3 et 5 questions, pas plus, pas moins
- Utilise un mix intelligent de types selon le contexte :
  - "stars" (note 1-5) : pour évaluer une dimension précise (qualité, service, propreté...)
  - "emoji" (échelle de satisfaction) : pour l'expérience globale ou l'humeur
  - "choice" : pour comprendre les préférences ou identifier des points spécifiques
  - "text" : TOUJOURS en dernière position, pour le commentaire libre
- Les questions doivent être en français québécois naturel (pas de "vous êtes satisfait de...", plutôt "Comment évaluez-vous...")
- Pour les questions "choice", fournis 3-5 options pertinentes au type de commerce
- Marque stars et emoji comme required:true, text comme required:false
- Pour chaque question stars et emoji, ajoute du branching conditionnel pertinent :
  - low : question orientée "problème" avec 3-4 options de raisons négatives spécifiques au commerce
  - high : question orientée "point fort" avec 3-4 options de raisons positives
  - Les seuils : stars low=1-2 high=4-5, emoji 5 niveaux low=1-2 high=4-5, emoji 3 niveaux low=1 high=3
- Ne mets PAS de branching sur les questions choice et text

Réponds UNIQUEMENT avec un JSON valide. Pas de markdown, pas de backticks, pas d'explication, pas de texte avant ou après le JSON.

Structure exacte :
{
  "title": "string — titre court et descriptif du formulaire",
  "description": "string — phrase d'accroche courte pour le client (ex: Aidez-nous à vous offrir la meilleure expérience.)",
  "questions": [
    {
      "type": "stars" | "emoji" | "choice" | "text",
      "label": "string — la question",
      "options": ["string"] | null,
      "required": true | false,
      "emojiLevels": 5 | 3 | null,
      "branching": {
        "low": {
          "triggerMin": 1,
          "triggerMax": 2,
          "followUpLabel": "string",
          "followUpOptions": ["string", "string", "string"],
          "allowFreeText": true
        },
        "high": {
          "triggerMin": 4,
          "triggerMax": 5,
          "followUpLabel": "string",
          "followUpOptions": ["string", "string", "string"],
          "allowFreeText": true
        }
      } | null
    }
  ]
}`;
=======
import { anthropic, AI_MODEL } from "@/lib/ai/client";
import {
  generateFormRequestSchema,
  aiFormResponseSchema,
} from "@/lib/ai/schemas";
import {
  buildGenerateSystemPrompt,
  buildGenerateUserMessage,
} from "@/lib/ai/prompts";
>>>>>>> feat/ai-wizard-chat

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
    select: { plan: true, aiGenerationsUsed: true },
  });

<<<<<<< HEAD
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Get user with plan info
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true, aiGenerationsUsed: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check limits for FREE plan
  if (dbUser.plan === "FREE" && dbUser.aiGenerationsUsed >= 3) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message:
          "Vous avez atteint la limite de 3 générations IA. Passez au Pro pour des générations illimitées.",
      },
      { status: 403 }
    );
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
=======
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (dbUser.plan === "FREE" && dbUser.aiGenerationsUsed >= 3) {
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
>>>>>>> feat/ai-wizard-chat
        { status: 500 }
      );
    }

<<<<<<< HEAD
    // Clean and parse JSON
    let rawText = textBlock.text.trim();
    // Remove potential markdown backticks
    rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          error: "invalid_json",
          message:
            "La génération n'a pas produit un résultat valide. Essayez une description plus détaillée.",
        },
        { status: 422 }
      );
    }

    // Validate with Zod
    const result = GeneratedFormSchema.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "validation_error",
          message:
            "La génération n'a pas produit un résultat valide. Essayez une description plus détaillée.",
        },
        { status: 422 }
      );
    }

    // Increment usage counter
=======
    const aiResult = JSON.parse(jsonMatch[0]);
    const validated = aiFormResponseSchema.safeParse(aiResult);

    if (!validated.success) {
      return NextResponse.json(
        { error: "AI response validation failed", details: validated.error.issues },
        { status: 500 }
      );
    }

    // Increment AI usage counter
>>>>>>> feat/ai-wizard-chat
    await prisma.user.update({
      where: { id: user.id },
      data: { aiGenerationsUsed: { increment: 1 } },
    });

<<<<<<< HEAD
    return NextResponse.json(result.data);
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Erreur lors de la génération." },
=======
    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
>>>>>>> feat/ai-wizard-chat
      { status: 500 }
    );
  }
}
