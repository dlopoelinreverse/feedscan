import { prisma } from "@/lib/prisma";
import {
  calculateAverageScore,
  calculateDelta,
  calculateResponseAverage,
  getChoiceDistribution,
  getCompletionRate,
  getFormQrScans,
  getPreviousPeriodResponses,
  getResponsesByPeriod,
  getResponseTrendData,
  getScoreDistribution,
  getTextAnswers,
  getTopFollowUpReasons,
  type AnswersMap,
} from "@/lib/analytics";
import { MetricCard } from "./metric-card";
import { PeriodSelector } from "./period-selector";
import { TrendChart } from "./trend-chart";
import { ChoiceDistributionChart, ScoreDistributionChart } from "./distribution-charts";
import { RecentResponses, type RecentResponseItem } from "./recent-responses";

export async function FormStats({
  userId,
  formId,
  period,
}: {
  userId: string;
  formId: string;
  period: number;
}) {
  const form = await prisma.form.findFirst({
    where: { id: formId, userId },
    include: {
      questions: { include: { followUpRules: true }, orderBy: { order: "asc" } },
    },
  });
  if (!form) return <p className="text-muted-foreground">Formulaire introuvable.</p>;

  const responses = await getResponsesByPeriod(form.id, period);
  const prevResponses = await getPreviousPeriodResponses(form.id, period);
  const totalScans = await getFormQrScans(form.id);

  const totalCurrent = responses.length;
  const totalPrevious = prevResponses.length;
  const responsesDelta = calculateDelta(totalCurrent, totalPrevious);

  const scoreCurrent = calculateAverageScore(responses, form.questions);
  const scorePrevious = calculateAverageScore(prevResponses, form.questions);
  const scoreDeltaVal = Math.round((scoreCurrent - scorePrevious) * 10) / 10;

  const completionRate = getCompletionRate(totalScans, totalCurrent);

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

  const recent: RecentResponseItem[] = responses.slice(0, 10).map((r) => {
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
  });

  const branchingQuestions = form.questions.filter(
    (q) => q.hasBranching && (q.type === "STARS" || q.type === "EMOJI")
  );

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-end">
        <PeriodSelector current={period} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Réponses totales"
          value={totalCurrent}
          delta={
            totalCurrent > 0 || totalPrevious > 0
              ? { ...responsesDelta, label: "vs période précédente" }
              : null
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
                  label: "",
                }
              : null
          }
        />
        <MetricCard title="Taux de complétion" value={`${completionRate}%`} />
      </div>

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

      {/* Per-question distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.questions.map((q) => {
          const label = q.labelFr || q.label;
          if (q.type === "STARS") {
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-6">
                <h4 className="text-sm font-semibold mb-3">{label}</h4>
                <ScoreDistributionChart data={getScoreDistribution(responses, q.id)} />
              </div>
            );
          }
          if (q.type === "EMOJI") {
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-6">
                <h4 className="text-sm font-semibold mb-3">{label}</h4>
                <ScoreDistributionChart
                  data={getScoreDistribution(responses, q.id)}
                  emojiLabels={(q.options as string[] | null) || undefined}
                />
              </div>
            );
          }
          if (q.type === "CHOICE") {
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-6">
                <h4 className="text-sm font-semibold mb-3">{label}</h4>
                <ChoiceDistributionChart data={getChoiceDistribution(responses, q.id)} />
              </div>
            );
          }
          if (q.type === "TEXT") {
            const texts = getTextAnswers(responses, q.id, 5);
            return (
              <div key={q.id} className="rounded-lg border border-border bg-card p-6">
                <h4 className="text-sm font-semibold mb-3">{label}</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {texts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun commentaire</p>
                  ) : (
                    texts.map((t, i) => (
                      <div key={i} className="rounded-md bg-muted/50 p-2 text-sm">
                        <p>« {t.text} »</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Branching insights */}
      {branchingQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Insights branching</h3>
          {branchingQuestions.map((q) => {
            const low = getTopFollowUpReasons(responses, q.id, "LOW");
            const high = getTopFollowUpReasons(responses, q.id, "HIGH");
            const lowCount = responses.filter((r) => {
              const v = (r.answers as AnswersMap)?.[q.id]?.value;
              return typeof v === "number" && v <= 2;
            }).length;
            const highCount = responses.filter((r) => {
              const v = (r.answers as AnswersMap)?.[q.id]?.value;
              return typeof v === "number" && v >= 4;
            }).length;

            return (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border border-l-4 border-l-[#E24B4A] bg-card p-5">
                  <h4 className="text-sm font-semibold">
                    {q.labelFr || q.label} — Score bas (1-2) · {lowCount} réponses
                  </h4>
                  <div className="space-y-2 mt-3">
                    {low.length === 0 ? (
                      <p className="text-xs text-muted-foreground">—</p>
                    ) : (
                      low.map((r) => (
                        <div key={r.option}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{r.option}</span>
                            <span className="font-semibold">{r.percentage}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-[#E24B4A]"
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-border border-l-4 border-l-[#00B894] bg-card p-5">
                  <h4 className="text-sm font-semibold">
                    {q.labelFr || q.label} — Score haut (4-5) · {highCount} réponses
                  </h4>
                  <div className="space-y-2 mt-3">
                    {high.length === 0 ? (
                      <p className="text-xs text-muted-foreground">—</p>
                    ) : (
                      high.map((r) => (
                        <div key={r.option}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{r.option}</span>
                            <span className="font-semibold">{r.percentage}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-[#00B894]"
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold mb-2">Dernières réponses</h3>
        <RecentResponses items={recent} />
      </div>
    </div>
  );
}
