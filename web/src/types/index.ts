export type PlanType = "FREE" | "PRO" | "BUSINESS";
export type FormStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type QuestionType = "STARS" | "EMOJI" | "CHOICE" | "TEXT";
export type FollowUpTrigger = "LOW" | "HIGH";
export type RateLimitMode = "NONE" | "PER_SESSION" | "PER_24H" | "PER_WEEK" | "CUSTOM";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  plan: PlanType;
  stripeCustomerId?: string | null;
  aiGenerationsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Form {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  status: FormStatus;
  slug: string;
  rateLimitMode: RateLimitMode;
  rateLimitHours?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  formId: string;
  type: QuestionType;
  label: string;
  options?: Record<string, unknown> | null;
  order: number;
  required: boolean;
  hasBranching: boolean;
  createdAt: Date;
}

export interface FollowUpRule {
  id: string;
  questionId: string;
  triggerType: FollowUpTrigger;
  triggerMin: number;
  triggerMax: number;
  followUpLabel: string;
  followUpOptions: Record<string, unknown>;
  allowFreeText: boolean;
}

export interface QRCode {
  id: string;
  formId: string;
  label: string;
  uniqueCode: string;
  scans: number;
  createdAt: Date;
}

export interface Visitor {
  id: string;
  cookieId?: string | null;
  fingerprintHash?: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  responseCount: number;
}

export interface Response {
  id: string;
  formId: string;
  qrCodeId?: string | null;
  visitorId?: string | null;
  answers: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
