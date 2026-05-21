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
  descriptionFr?: string;
  descriptionEn?: string;
  status: FormStatusState;
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

/**
 * Returns smart default values for a brand new question of the given type.
 * The translator must be scoped to `forms.defaultQuestion`.
 */
export type DefaultQuestionTranslator = (
  key: "stars" | "emoji" | "choice" | "text" | "textPlaceholder"
) => string;

export function defaultQuestionLabel(
  type: QuestionType,
  t: DefaultQuestionTranslator
): string {
  switch (type) {
    case "STARS":
      return t("stars");
    case "EMOJI":
      return t("emoji");
    case "CHOICE":
      return t("choice");
    case "TEXT":
      return t("text");
  }
}

export function defaultQuestionPlaceholder(
  type: QuestionType,
  t: DefaultQuestionTranslator
): string {
  if (type === "TEXT") {
    return t("textPlaceholder");
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
