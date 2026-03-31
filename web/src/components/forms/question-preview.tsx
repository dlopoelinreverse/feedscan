import { type Question } from "@/types";

interface QuestionPreviewProps {
  question: Question;
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question.label}</p>
      {question.required && (
        <span className="text-xs text-destructive">* Required</span>
      )}
    </div>
  );
}
