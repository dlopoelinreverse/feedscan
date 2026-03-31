import { type Question } from "@/types";

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium">{question.label}</p>
      <p className="text-xs text-muted-foreground mt-1">{question.type}</p>
    </div>
  );
}
