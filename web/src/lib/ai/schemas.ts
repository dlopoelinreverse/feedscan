import { z } from "zod/v4";

// --- Analyze Business (Étape A) ---

export const analyzeBusinessRequestSchema = z.object({
  formId: z.string().optional(),
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  description: z.string().optional(),
  locale: z.enum(["fr", "en"]),
});

export type AnalyzeBusinessRequest = z.infer<typeof analyzeBusinessRequestSchema>;

export const angleSchema = z.object({
  id: z.string(),
  labelFr: z.string(),
  labelEn: z.string(),
  rationaleFr: z.string(),
  rationaleEn: z.string(),
});

export type Angle = z.infer<typeof angleSchema>;

export const analyzeBusinessResponseSchema = z.object({
  angles: z.array(angleSchema).min(6).max(14),
});

export type AnalyzeBusinessResponse = z.infer<typeof analyzeBusinessResponseSchema>;

// --- Generate Form ---

export const generateFormRequestSchema = z.object({
  formId: z.string().min(1),
  selectedAngles: z.array(angleSchema).min(3).max(5),
  specificRequest: z.string().optional(),
});

export type GenerateFormRequest = z.infer<typeof generateFormRequestSchema>;

const branchingSchema = z.object({
  low: z.object({
    triggerMin: z.number(),
    triggerMax: z.number(),
    followUpLabelFr: z.string(),
    followUpLabelEn: z.string(),
    followUpOptionsFr: z.array(z.string()),
    followUpOptionsEn: z.array(z.string()),
    allowFreeText: z.boolean(),
  }),
  high: z.object({
    triggerMin: z.number(),
    triggerMax: z.number(),
    followUpLabelFr: z.string(),
    followUpLabelEn: z.string(),
    followUpOptionsFr: z.array(z.string()),
    followUpOptionsEn: z.array(z.string()),
    allowFreeText: z.boolean(),
  }),
});

const aiQuestionSchema = z.object({
  type: z.enum(["stars", "emoji", "choice", "text"]),
  labelFr: z.string(),
  labelEn: z.string(),
  optionsFr: z.array(z.string()).nullable().optional(),
  optionsEn: z.array(z.string()).nullable().optional(),
  required: z.boolean(),
  emojiLevels: z.union([z.literal(5), z.literal(3)]).nullable().optional(),
  branching: branchingSchema.nullable().optional(),
});

export const aiFormResponseSchema = z.object({
  titleFr: z.string(),
  titleEn: z.string(),
  descriptionFr: z.string(),
  descriptionEn: z.string(),
  questions: z.array(aiQuestionSchema).min(3).max(5),
});

export type AiFormResponse = z.infer<typeof aiFormResponseSchema>;

// --- Refine Form ---

export const refineFormRequestSchema = z.object({
  currentForm: aiFormResponseSchema,
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  userMessage: z.string().min(1),
  userLocale: z.enum(["fr", "en"]),
});

export type RefineFormRequest = z.infer<typeof refineFormRequestSchema>;

export const refineFormResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(z.string()),
  form: aiFormResponseSchema,
});

export type RefineFormResponse = z.infer<typeof refineFormResponseSchema>;

// --- Translate Form ---

export const translateFormRequestSchema = z.object({
  form: aiFormResponseSchema,
  sourceLang: z.enum(["fr", "en"]),
  targetLang: z.enum(["fr", "en"]),
});

export type TranslateFormRequest = z.infer<typeof translateFormRequestSchema>;
