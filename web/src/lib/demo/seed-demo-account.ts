import "server-only";

import { nanoid } from "nanoid";
import type { Prisma } from "@prisma/client";

const THEME_CONFIG = {
  preset: "minimal",
  primaryColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  fontFamily: "inter",
  borderRadius: "md",
  logoUrl: null,
};

const POSITIVE_EMOJIS = ["happy", "love"];
const MIXED_EMOJIS = ["neutral", "sad"];

const CHOICE_OPTIONS_FR = ["Google", "Bouche-à-oreille", "Réseaux sociaux", "En passant"];
const CHOICE_OPTIONS_EN = ["Google", "Word of mouth", "Social media", "Just passing by"];

const FOLLOWUP_OPTIONS_FR = ["Service", "Ambiance", "Qualité des produits", "Prix"];
const FOLLOWUP_OPTIONS_EN = ["Service", "Atmosphere", "Product quality", "Pricing"];

const POSITIVE_COMMENTS_FR = [
  "Super expérience, je reviendrai !",
  "Personnel très accueillant.",
  "Excellente ambiance.",
  "Tout était parfait, merci.",
];
const MIXED_COMMENTS_FR = [
  "Service un peu lent ce soir.",
  "Plat correct mais sans plus.",
  "Salle bruyante, dommage.",
  "Attente trop longue à l'accueil.",
];

interface SeededQuestionRefs {
  starsOverallId: string;
  emojiMoodId: string;
  choiceHearAboutId: string;
  textCommentId: string;
  starsServiceId: string;
  followUpRuleId: string;
}

function randomDateWithin(daysBack: number, refNow: number): Date {
  const offset = Math.random() * daysBack * 86_400_000;
  return new Date(refNow - offset);
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function buildPositiveAnswers(refs: SeededQuestionRefs): Record<string, unknown> {
  return {
    [refs.starsOverallId]: { value: Math.random() < 0.5 ? 5 : 4 },
    [refs.emojiMoodId]: { value: pickRandom(POSITIVE_EMOJIS) },
    [refs.choiceHearAboutId]: { value: [pickRandom(CHOICE_OPTIONS_FR)] },
    ...(Math.random() < 0.5
      ? { [refs.textCommentId]: { value: pickRandom(POSITIVE_COMMENTS_FR) } }
      : {}),
    [refs.starsServiceId]: { value: Math.random() < 0.5 ? 5 : 4 },
  };
}

function buildMixedAnswers(refs: SeededQuestionRefs): Record<string, unknown> {
  const serviceRating = 1 + Math.floor(Math.random() * 3); // 1..3 triggers LOW follow-up
  const addFollowUp = Math.random() < 0.6;
  return {
    [refs.starsOverallId]: { value: 1 + Math.floor(Math.random() * 3) },
    [refs.emojiMoodId]: { value: pickRandom(MIXED_EMOJIS) },
    [refs.choiceHearAboutId]: { value: [pickRandom(CHOICE_OPTIONS_FR)] },
    ...(Math.random() < 0.7
      ? { [refs.textCommentId]: { value: pickRandom(MIXED_COMMENTS_FR) } }
      : {}),
    [refs.starsServiceId]: addFollowUp
      ? {
          value: serviceRating,
          followUp: {
            ruleId: refs.followUpRuleId,
            selected: [pickRandom(FOLLOWUP_OPTIONS_FR)],
            freeText:
              Math.random() < 0.4
                ? "Le temps d'attente pourrait être amélioré."
                : undefined,
          },
        }
      : { value: serviceRating },
  };
}

export async function seedDemoAccount(
  userId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  const now = Date.now();
  const formCreatedAt = new Date(now - 30 * 86_400_000);

  const theme = await tx.theme.create({
    data: {
      userId,
      name: "Démo · Ocean",
      config: THEME_CONFIG,
      isDefault: true,
      createdAt: formCreatedAt,
    },
  });

  const form = await tx.form.create({
    data: {
      userId,
      themeId: theme.id,
      title: "Comment s'est passée votre visite ?",
      titleFr: "Comment s'est passée votre visite ?",
      titleEn: "How was your visit?",
      description: "Votre avis nous aide à mieux vous accueillir.",
      descriptionFr: "Votre avis nous aide à mieux vous accueillir.",
      descriptionEn: "Your feedback helps us welcome you better.",
      status: "ACTIVE",
      slug: `demo-${nanoid(6)}`,
      rateLimitMode: "PER_24H",
      createdAt: formCreatedAt,
    },
  });

  const starsOverall = await tx.question.create({
    data: {
      formId: form.id,
      type: "STARS",
      label: "Note globale",
      labelFr: "Note globale",
      labelEn: "Overall rating",
      options: [],
      order: 0,
      required: true,
      hasBranching: false,
    },
  });

  const emojiMood = await tx.question.create({
    data: {
      formId: form.id,
      type: "EMOJI",
      label: "Votre humeur",
      labelFr: "Votre humeur",
      labelEn: "Your mood",
      options: [],
      order: 1,
      required: false,
      hasBranching: false,
    },
  });

  const choiceHearAbout = await tx.question.create({
    data: {
      formId: form.id,
      type: "CHOICE",
      label: "Comment nous avez-vous connu ?",
      labelFr: "Comment nous avez-vous connu ?",
      labelEn: "How did you hear about us?",
      options: CHOICE_OPTIONS_FR,
      order: 2,
      required: false,
      hasBranching: false,
    },
  });

  const textComment = await tx.question.create({
    data: {
      formId: form.id,
      type: "TEXT",
      label: "Commentaire libre",
      labelFr: "Commentaire libre",
      labelEn: "Free comment",
      options: [],
      order: 3,
      required: false,
      hasBranching: false,
    },
  });

  const starsService = await tx.question.create({
    data: {
      formId: form.id,
      type: "STARS",
      label: "Qualité du service",
      labelFr: "Qualité du service",
      labelEn: "Service quality",
      options: [],
      order: 4,
      required: true,
      hasBranching: true,
    },
  });

  const followUpRule = await tx.followUpRule.create({
    data: {
      questionId: starsService.id,
      triggerType: "LOW",
      triggerMin: 1,
      triggerMax: 2,
      followUpLabel: "Que pouvons-nous améliorer ?",
      followUpLabelFr: "Que pouvons-nous améliorer ?",
      followUpLabelEn: "What can we improve?",
      followUpOptions: FOLLOWUP_OPTIONS_FR,
      followUpOptionsFr: FOLLOWUP_OPTIONS_FR,
      followUpOptionsEn: FOLLOWUP_OPTIONS_EN,
      allowFreeText: true,
    },
  });

  const qrCode = await tx.qRCode.create({
    data: {
      formId: form.id,
      label: "Table principale",
      uniqueCode: nanoid(),
      scans: 47,
      createdAt: formCreatedAt,
    },
  });

  const refs: SeededQuestionRefs = {
    starsOverallId: starsOverall.id,
    emojiMoodId: emojiMood.id,
    choiceHearAboutId: choiceHearAbout.id,
    textCommentId: textComment.id,
    starsServiceId: starsService.id,
    followUpRuleId: followUpRule.id,
  };

  const responsesData: Prisma.ResponseCreateManyInput[] = [];
  for (let i = 0; i < 25; i++) {
    const isPositive = Math.random() < 0.6;
    const isDirect = i < 3;
    responsesData.push({
      formId: form.id,
      qrCodeId: isDirect ? null : qrCode.id,
      answers: (isPositive
        ? buildPositiveAnswers(refs)
        : buildMixedAnswers(refs)) as Prisma.InputJsonValue,
      metadata: {
        userAgent: "demo",
        language: "fr",
        screenWidth: 390,
        screenHeight: 844,
      } as Prisma.InputJsonValue,
      createdAt: randomDateWithin(30, now),
    });
  }
  await tx.response.createMany({ data: responsesData });

  const conversation = await tx.aiConversation.create({
    data: {
      formId: form.id,
      userId,
      phase: "wizard",
      businessContext: {
        industry: "café-restaurant",
        target: "clientèle locale et touristes",
        goals: ["satisfaction", "fidélisation"],
      },
      proposedAngles: [
        { id: "ambiance", label: "Ambiance et cadre" },
        { id: "service", label: "Service et accueil" },
        { id: "products", label: "Qualité des produits" },
      ],
      selectedAngles: [
        { id: "service", label: "Service et accueil" },
        { id: "products", label: "Qualité des produits" },
      ],
      generatedForm: {
        title: form.title,
        questionsCount: 5,
      },
      createdAt: formCreatedAt,
    },
  });

  const baseMs = formCreatedAt.getTime();
  await tx.aiMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: "user",
        content:
          "On a un café-restaurant à Montréal, j'aimerais comprendre ce qui plait ou pas à nos clients.",
        createdAt: new Date(baseMs),
      },
      {
        conversationId: conversation.id,
        role: "assistant",
        content:
          "Parfait. Pour un café-restaurant, je vous propose d'explorer 3 axes : ambiance, service et qualité des produits. Lequel est le plus prioritaire ?",
        createdAt: new Date(baseMs + 60_000),
      },
      {
        conversationId: conversation.id,
        role: "user",
        content:
          "Service et qualité des produits surtout. L'ambiance on la maitrise déjà.",
        createdAt: new Date(baseMs + 120_000),
      },
      {
        conversationId: conversation.id,
        role: "assistant",
        content:
          "Compris. Je génère un formulaire court (≈45s pour répondre) avec une note globale, une note service, et un follow-up ciblé quand la note est basse.",
        createdAt: new Date(baseMs + 180_000),
      },
    ],
  });
}
