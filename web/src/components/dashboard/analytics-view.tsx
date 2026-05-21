import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  calculateAverageScore,
  calculateDelta,
  calculateResponseAverage,
  getCompletionRate,
  getFormQrScans,
  getResponsesByPeriod,
  getPreviousPeriodResponses,
  getResponseTrendData,
  getScoreDistribution,
  getTopFollowUpReasons,
  type AnswersMap,
} from "@/lib/analytics";
import { MetricCard } from "./metric-card";
import { PeriodSelector } from "./period-selector";
import { TrendChart } from "./trend-chart";
import { ScoresByCriterion, type CriterionScore } from "./scores-by-criterion";
import { RecentResponses, type RecentResponseItem } from "./recent-responses";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaQuestion = any;

export async function AnalyticsView({
  userId,
  formId: explicitFormId,
  period,
  showHeader = true,
  title,
}: {
  userId: string;
  formId?: string;
  period: number;
  showHeader?: boolean;
  title?: string;
}) {
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  // Resolve form: explicit or active
  const form = explicitFormId
    ? await prisma.form.findFirst({
        where: { id: explicitFormId, userId },
        include: { questions: { include: { followUpRules: true }, orderBy: { order: "asc" } } },
      })
    : await prisma.form.findFirst({
        where: { userId, status: "ACTIVE" },
        include: { questions: { include: { followUpRules: true }, orderBy: { order: "asc" } } },
      });

  const responses = form ? await getResponsesByPeriod(form.id, period) : [];
  const prevResponses = form ? await getPreviousPeriodResponses(form.id, period) : [];
  const totalScans = form ? await getFormQrScans(form.id) : 0;

  const totalCurrent = responses.length;
  const totalPrevious = prevResponses.length;
  const responsesDelta = calculateDelta(totalCurrent, totalPrevious);

  const scoreCurrent = form ? calculateAverageScore(responses, form.questions) : 0;
  const scorePrevious = form ? calculateAverageScore(prevResponses, form.questions) : 0;
  const scoreDeltaVal = Math.round((scoreCurrent - scorePrevious) * 10) / 10;

  const completionRate = getCompletionRate(totalScans, totalCurrent);
  const prevCompletionRate = getCompletionRate(
    Math.max(totalScans - totalCurrent, 0),
    totalPrevious
  );
  const completionDelta = calculateDelta(completionRate, prevCompletionRate);

  // Trend data: current period + previous period aligned
  const currentTrend = getResponseTrendData(responses, period);
  const prevTrend = getResponseTrendData(
    prevResponses,
    period,
    new Date(Date.now() - period * 86400000)
  );
  const trendData = currentTrend.map((c, i) => ({
    date: c.date,
    current: c.count,
    previous: prevTrend[i]?.count || 0,
  }));

  // Scores by criterion (STARS + EMOJI)
  const criteria: CriterionScore[] = form
    ? form.questions
        .filter((q: PrismaQuestion) => q.type === "STARS" || q.type === "EMOJI")
        .map((q: PrismaQuestion) => {
          const avg = calculateAverageScore(responses, [q]);
          const topReasons =
            q.hasBranching && avg < 3.5
              ? getTopFollowUpReasons(responses, q.id, "LOW").map((r) => ({
                  option: r.option,
                  percentage: r.percentage,
                }))
              : undefined;
          return {
            questionId: q.id,
            label: q.labelFr || q.label,
            score: avg,
            topReasons,
          };
        })
    : [];

  // Recent responses
  const recent: RecentResponseItem[] = form
    ? responses.slice(0, 10).map((r) => {
        const answers = (r.answers as AnswersMap) || {};
        return {
          id: r.id,
          formTitle: form.titleFr || form.title,
          createdAt: r.createdAt.toISOString(),
          avgScore: calculateResponseAverage(r, form.questions),
          metadata: (r.metadata as { device?: string; lang?: string }) || undefined,
          details: form.questions.map((q: PrismaQuestion) => {
            const a = answers[q.id];
            let answerText = "—";
            if (a) {
              if (q.type === "EMOJI" && typeof a.value === "number") {
                const opts = (q.options as string[] | null) || [];
                answerText = opts[a.value - 1] || `${a.value}`;
              } else if (q.type === "STARS") {
                answerText = `${a.value}/5`;
              } else if (Array.isArray(a.value)) {
                answerText = a.value.join(", ");
              } else {
                answerText = String(a.value);
              }
            }
            return {
              questionLabel: q.labelFr || q.label,
              questionType: q.type,
              answer: answerText,
              followUp: a?.followUp,
            };
          }),
        };
      })
    : [];

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">{title ?? t("title")}</h1>
          <PeriodSelector current={period} />
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t("metrics.totalResponses")}
          value={totalCurrent}
          delta={
            totalCurrent > 0 || totalPrevious > 0
              ? { ...responsesDelta, label: t("metrics.vsLastPeriod") }
              : null
          }
          emptyMessage={
            totalCurrent === 0 && totalPrevious === 0
              ? t("metrics.shareQrToCollect")
              : undefined
          }
        />
        <MetricCard
          title={t("metrics.averageScore")}
          value={scoreCurrent > 0 ? `${scoreCurrent.toFixed(1)} / 5` : "—"}
          delta={
            scoreCurrent > 0 && scorePrevious > 0
              ? {
                  value: scoreDeltaVal,
                  isPositive: scoreDeltaVal >= 0,
                  label: t("metrics.thisMonth"),
                }
              : null
          }
        />
        <MetricCard
          title={t("metrics.activeForm")}
          value={form ? form.titleFr || form.title : tCommon("none")}
          description={
            form ? t("metrics.questionsCount", { count: form.questions.length }) : undefined
          }
          emptyMessage={!form ? t("metrics.publishForm") : undefined}
        />
        <MetricCard
          title={t("metrics.completionRate")}
          value={`${completionRate}%`}
          delta={
            totalScans > 0
              ? { ...completionDelta, label: t("metrics.thisWeek") }
              : null
          }
        />
      </div>

      {!form && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t("empty.noActiveForm")}
          </p>
          <Button asChild>
            <Link href="/dashboard/forms/new">{t("empty.createForm")}</Link>
          </Button>
        </div>
      )}

      {form && (
        <>
          {/* Trend chart */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-4">
              {t("charts.responseTrendWithDays", { days: period })}
            </h3>
            <TrendChart
              data={trendData}
              currentLabel={t("charts.thisMonth")}
              previousLabel={t("charts.previousPeriod")}
              emptyMessage={t("charts.noData")}
            />
          </div>

          {/* Scores by criterion */}
          {criteria.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold mb-4">{t("stats.scoresByCriterion")}</h3>
              <ScoresByCriterion items={criteria} topReasonsLabel={t("charts.topReasons")} />
            </div>
          )}

          {/* Recent responses */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold mb-2">{t("recentResponses.title")}</h3>
            <RecentResponses items={recent} />
          </div>
        </>
      )}
    </div>
  );
}
