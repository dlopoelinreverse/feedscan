export type QuestionType = "STARS" | "EMOJI" | "CHOICE" | "TEXT";

export interface FollowUpRuleState {
  id?: string;
  triggerType: "LOW" | "HIGH";
  triggerMin: number;
  triggerMax: number;
  followUpLabel: string;
  followUpOptions: string[];
  allowFreeText: boolean;
}

export interface QuestionState {
  clientId: string;
  id?: string;
  type: QuestionType;
  label: string;
  options: string[];
  order: number;
  required: boolean;
  hasBranching: boolean;
  emojiLevels?: number;
  multipleChoice?: boolean;
  placeholder?: string;
  followUpRules: FollowUpRuleState[];
}

export interface FormBuilderState {
  id?: string;
  title: string;
  description: string;
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
