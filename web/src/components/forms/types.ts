export type QuestionType = "STARS" | "EMOJI" | "CHOICE" | "TEXT";

export type PreviewLocale = "fr" | "en";

export function bilingualText(
  fr: string | undefined | null,
  en: string | undefined | null,
  locale: PreviewLocale
): string {
  if (locale === "fr") return fr || en || "";
  return en || fr || "";
}

export function bilingualOptions(
  fr: string[] | undefined | null,
  en: string[] | undefined | null,
  locale: PreviewLocale
): string[] {
  if (locale === "fr") return fr ?? en ?? [];
  return en ?? fr ?? [];
}

export interface FollowUpRuleState {
  id?: string;
  triggerType: "LOW" | "HIGH";
  triggerMin: number;
  triggerMax: number;
  followUpLabel: string;
  followUpLabelFr?: string;
  followUpLabelEn?: string;
  followUpOptions: string[];
  followUpOptionsFr?: string[];
  followUpOptionsEn?: string[];
  allowFreeText: boolean;
  enabled: boolean;
  allowOptions: boolean;
}

export interface QuestionState {
  clientId: string;
  id?: string;
  type: QuestionType;
  label: string;
  labelFr?: string;
  labelEn?: string;
  options: string[];
  optionsFr?: string[];
  optionsEn?: string[];
  order: number;
  required: boolean;
  hasBranching: boolean;
  emojiLevels?: number;
  multipleChoice?: boolean;
  placeholder?: string;
  followUpRules: FollowUpRuleState[];
}

export type FormStatusState = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface FormBuilderState {
  id?: string;
  title: string;
  titleFr?: string;
  titleEn?: string;
  description: string;
<<<<<<< HEAD
  status: FormStatusState;
=======
  descriptionFr?: string;
  descriptionEn?: string;
>>>>>>> feat/ai-wizard-chat
  rateLimitMode: "NONE" | "PER_SESSION" | "PER_24H" | "PER_WEEK" | "CUSTOM";
  rateLimitHours?: number;
  questions: QuestionState[];
}

export const QUESTION_TYPE_BADGE: Record<
  QuestionType,
  { bg: string; text: string }
> = {
  STARS: { bg: "bg-[#FEF3E2]", text: "text-[#BA7517]" },
  EMOJI: { bg: "bg-[#EAE6FD]", text: "text-[#534AB7]" },
  CHOICE: { bg: "bg-[#E6F1FB]", text: "text-[#185FA5]" },
  TEXT: { bg: "bg-[#E1F5EE]", text: "text-[#0F6E56]" },
};

/** Returns default follow-up rules for a STARS or EMOJI question. */
export function defaultFollowUpRules(
  type: QuestionType,
  emojiLevels?: number
): FollowUpRuleState[] {
  if (type === "STARS") {
    return [
      {
        triggerType: "LOW",
        triggerMin: 1,
        triggerMax: 2,
        followUpLabel: "",
        followUpOptions: [],
        allowFreeText: true,
        allowOptions: true,
        enabled: true,
      },
      {
        triggerType: "HIGH",
        triggerMin: 4,
        triggerMax: 5,
        followUpLabel: "",
        followUpOptions: [],
        allowFreeText: true,
        allowOptions: true,
        enabled: true,
      },
    ];
  }
  if (type === "EMOJI") {
    const levels = emojiLevels ?? 5;
    if (levels === 3) {
      return [
        {
          triggerType: "LOW",
          triggerMin: 1,
          triggerMax: 1,
          followUpLabel: "",
          followUpOptions: [],
          allowFreeText: true,
          allowOptions: true,
          enabled: true,
        },
        {
          triggerType: "HIGH",
          triggerMin: 3,
          triggerMax: 3,
          followUpLabel: "",
          followUpOptions: [],
          allowFreeText: true,
          allowOptions: true,
          enabled: true,
        },
      ];
    }
    return [
      {
        triggerType: "LOW",
        triggerMin: 1,
        triggerMax: 2,
        followUpLabel: "",
        followUpOptions: [],
        allowFreeText: true,
        allowOptions: true,
        enabled: true,
      },
      {
        triggerType: "HIGH",
        triggerMin: 4,
        triggerMax: 5,
        followUpLabel: "",
        followUpOptions: [],
        allowFreeText: true,
        allowOptions: true,
        enabled: true,
      },
    ];
  }
  return [];
}

/** Returns smart default values for a brand new question of the given type. */
export function defaultQuestionLabel(type: QuestionType): string {
  switch (type) {
    case "STARS":
      return "Comment \u00e9valuez-vous la qualit\u00e9 du service ?";
    case "EMOJI":
      return "Comment \u00e9tait votre exp\u00e9rience ?";
    case "CHOICE":
      return "Qu'est-ce qui vous a le plus plu ?";
    case "TEXT":
      return "Un commentaire ou une suggestion ?";
  }
}

export function defaultQuestionPlaceholder(type: QuestionType): string {
  if (type === "TEXT") {
    return "Dites-nous ce qui pourrait \u00eatre am\u00e9lior\u00e9...";
  }
  return "";
}

export function defaultRequired(type: QuestionType): boolean {
  // Choice and text are optional by default per spec
  return type === "STARS" || type === "EMOJI";
}

export function canHaveBranching(type: QuestionType): boolean {
  return type === "STARS" || type === "EMOJI";
}
