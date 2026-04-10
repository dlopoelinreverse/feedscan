export interface CriterionScore {
  questionId: string;
  label: string;
  score: number;
  topReasons?: { option: string; percentage: number }[];
}

function scoreColor(score: number): string {
  if (score >= 4) return "#00B894";
  if (score >= 3) return "#FDCB6E";
  return "#E24B4A";
}

export function ScoresByCriterion({
  items,
  topReasonsLabel,
}: {
  items: CriterionScore[];
  topReasonsLabel: string;
}) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-4">
      {sorted.map((item) => (
        <div key={item.questionId}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-foreground">{item.label}</span>
            <span className="font-semibold">{item.score.toFixed(1)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(item.score / 5) * 100}%`,
                backgroundColor: scoreColor(item.score),
              }}
            />
          </div>
          {item.score < 3.5 && item.topReasons && item.topReasons.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {topReasonsLabel}:{" "}
              {item.topReasons
                .map((r) => `${r.option} (${r.percentage}%)`)
                .join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
