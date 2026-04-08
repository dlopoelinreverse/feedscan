export interface PublicFollowUpRule {
  id: string;
  triggerType: "LOW" | "HIGH";
  triggerMin: number;
  triggerMax: number;
  followUpLabel: string;
  followUpOptions: string[];
  allowFreeText: boolean;
}

export interface PublicQuestion {
  id: string;
  type: "STARS" | "EMOJI" | "CHOICE" | "TEXT";
  label: string;
  options: string[];
  required: boolean;
  hasBranching: boolean;
  emojiLevels?: number;
  multipleChoice?: boolean;
  placeholder?: string | null;
  followUpRules: PublicFollowUpRule[];
}

export interface PublicFormData {
  id: string;
  title: string;
  description: string | null;
  rateLimitMode: "NONE" | "PER_SESSION" | "PER_24H" | "PER_WEEK" | "CUSTOM";
  rateLimitHours: number | null;
  questions: PublicQuestion[];
}

export type AnswerValue = number | string | string[];

export interface AnswerState {
  value: AnswerValue;
  followUp?: {
    ruleId: string;
    selected: string[];
    freeText?: string;
  };
}
