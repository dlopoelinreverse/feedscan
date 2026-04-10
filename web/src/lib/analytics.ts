import { prisma } from "@/lib/prisma";
import type { Question, Response } from "@prisma/client";

/**
 * Answer shape stored in Response.answers (Json).
 * {
 *   [questionId]: {
 *     value: number | string | string[],
 *     followUp?: { selected: string[], freeText?: string }
 *   }
 * }
 */
export type AnswerValue = {
  value: number | string | string[];
  followUp?: { selected: string[]; freeText?: string };
};
export type AnswersMap = Record<string, AnswerValue>;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getPeriodRange(days: number, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevEnd = new Date(start);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, end, prevStart, prevEnd };
}

export async function getResponsesByPeriod(
  formId: string,
  days: number
): Promise<Response[]> {
  const { start, end } = getPeriodRange(days);
  return prisma.response.findMany({
    where: { formId, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPreviousPeriodResponses(
  formId: string,
  days: number
): Promise<Response[]> {
  const { prevStart, prevEnd } = getPeriodRange(days);
  return prisma.response.findMany({
    where: { formId, createdAt: { gte: prevStart, lt: prevEnd } },
  });
}

function answerAsNumber(a: AnswerValue | undefined): number | null {
  if (!a) return null;
  if (typeof a.value === "number") return a.value;
  const n = Number(a.value);
  return Number.isFinite(n) ? n : null;
}

export function calculateAverageScore(
  responses: Response[],
  questions: Pick<Question, "id" | "type">[]
): number {
  const scoringIds = new Set(
    questions.filter((q) => q.type === "STARS" || q.type === "EMOJI").map((q) => q.id)
  );
  if (scoringIds.size === 0 || responses.length === 0) return 0;

  let sum = 0;
  let count = 0;
  for (const r of responses) {
    const answers = (r.answers as AnswersMap) || {};
    for (const qid of scoringIds) {
      const n = answerAsNumber(answers[qid]);
      if (n !== null && n >= 1 && n <= 5) {
        sum += n;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

export function calculateResponseAverage(
  response: Response,
  questions: Pick<Question, "id" | "type">[]
): number {
  const answers = (response.answers as AnswersMap) || {};
  let sum = 0;
  let count = 0;
  for (const q of questions) {
    if (q.type !== "STARS" && q.type !== "EMOJI") continue;
    const n = answerAsNumber(answers[q.id]);
    if (n !== null) {
      sum += n;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

export function calculateDelta(
  current: number,
  previous: number
): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  }
  const value = ((current - previous) / previous) * 100;
  return { value: Math.round(value * 10) / 10, isPositive: value >= 0 };
}

export function getScoreDistribution(
  responses: Response[],
  questionId: string
): { score: number; count: number }[] {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of responses) {
    const a = (r.answers as AnswersMap)?.[questionId];
    const n = answerAsNumber(a);
    if (n !== null && n >= 1 && n <= 5) dist[Math.round(n)]++;
  }
  return [1, 2, 3, 4, 5].map((score) => ({ score, count: dist[score] }));
}

export function getChoiceDistribution(
  responses: Response[],
  questionId: string
): { option: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of responses) {
    const a = (r.answers as AnswersMap)?.[questionId];
    if (!a) continue;
    const values = Array.isArray(a.value) ? a.value : [a.value];
    for (const v of values) {
      if (typeof v === "string" && v.length > 0) {
        map.set(v, (map.get(v) || 0) + 1);
      }
    }
  }
  return Array.from(map.entries())
    .map(([option, count]) => ({ option, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTextAnswers(
  responses: Response[],
  questionId: string,
  limit = 5
): { text: string; createdAt: Date }[] {
  const out: { text: string; createdAt: Date }[] = [];
  for (const r of responses) {
    const a = (r.answers as AnswersMap)?.[questionId];
    if (a && typeof a.value === "string" && a.value.trim().length > 0) {
      out.push({ text: a.value, createdAt: r.createdAt });
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function getTopFollowUpReasons(
  responses: Response[],
  questionId: string,
  triggerType: "LOW" | "HIGH"
): { option: string; count: number; percentage: number }[] {
  const tally = new Map<string, number>();
  let total = 0;
  for (const r of responses) {
    const a = (r.answers as AnswersMap)?.[questionId];
    if (!a) continue;
    const n = answerAsNumber(a);
    if (n === null) continue;
    const isLow = n <= 2;
    const isHigh = n >= 4;
    if (triggerType === "LOW" && !isLow) continue;
    if (triggerType === "HIGH" && !isHigh) continue;
    const selected = a.followUp?.selected || [];
    for (const s of selected) {
      tally.set(s, (tally.get(s) || 0) + 1);
      total++;
    }
  }
  return Array.from(tally.entries())
    .map(([option, count]) => ({
      option,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

export function getCompletionRate(totalScans: number, totalResponses: number): number {
  if (totalScans === 0) return 0;
  return Math.min(100, Math.round((totalResponses / totalScans) * 100));
}

export function getResponseTrendData(
  responses: Response[],
  days: number,
  now = new Date()
): { date: string; count: number }[] {
  const buckets: { date: string; count: number; ts: number }[] = [];
  const today = startOfDay(now);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count: 0,
      ts: d.getTime(),
    });
  }
  for (const r of responses) {
    const d = startOfDay(new Date(r.createdAt)).getTime();
    const b = buckets.find((x) => x.ts === d);
    if (b) b.count++;
  }
  return buckets.map(({ date, count }) => ({ date, count }));
}

export async function getFormQrScans(formId: string): Promise<number> {
  const result = await prisma.qRCode.aggregate({
    where: { formId },
    _sum: { scans: true },
  });
  return result._sum.scans || 0;
}
