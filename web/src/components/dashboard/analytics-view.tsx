import Link from "next/link";
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
        .filter((q) => q.type === "STARS" || q.type === "EMOJI")
        .map((q) => {
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
          details: form.questions.map((q) => {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title ?? "Dashboard"}</h1>
          <PeriodSelector current={period} />
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Réponses totales"
          value={totalCurrent}
          delta={
            totalCurrent > 0 || totalPrevious > 0
              ? { ...responsesDelta, label: "vs période précédente" }
              : null
          }
          emptyMessage={
            totalCurrent === 0 && totalPrevious === 0
              ? "Partagez votre QR code pour recevoir des réponses"
              : undefined
          }
        />
        <MetricCard
          title="Score moyen"
          value={scoreCurrent > 0 ? `${scoreCurrent.toFixed(1)} / 5` : "—"}
          delta={
            scoreCurrent > 0 && scorePrevious > 0
              ? {
                  value: scoreDeltaVal,
                  isPositive: scoreDeltaVal >= 0,
                  label: "ce mois",
                }
              : null
          }
        />
        <MetricCard
          title="Formulaire actif"
          value={form ? form.titleFr || form.title : "Aucun"}
          description={form ? `${form.questions.length} questions` : undefined}
          emptyMessage={!form ? "Publier un formulaire" : undefined}
        />
        <MetricCard
          title="Taux de complétion"
          value={`${completionRate}%`}
          delta={
            totalScans > 0
              ? { ...completionDelta, label: "cette semaine" }
              : null
          }
        />
      </div>

      {!form && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Aucun formulaire actif. Publiez un formulaire pour commencer à collecter du feedback.
          </p>
          <Button asChild>
            <Link href="/dashboard/forms/new">Créer un formulaire</Link>
          </Button>
        </div>
      )}

      {form && (
        <>
          {/* Trend chart */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">
              Tendance des réponses ({period} jours)
            </h3>
            <TrendChart
              data={trendData}
              currentLabel="Ce mois"
              previousLabel="Période précédente"
              emptyMessage="Pas encore de données"
            />
          </div>

          {/* Scores by criterion */}
          {criteria.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-sm font-semibold mb-4">Scores par critère</h3>
              <ScoresByCriterion items={criteria} topReasonsLabel="Top raisons" />
            </div>
          )}

          {/* Recent responses */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-2">Dernières réponses</h3>
            <RecentResponses items={recent} />
          </div>
        </>
      )}
    </div>
  );
}
