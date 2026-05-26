import { AiReflectionCoachNotebook } from "@/components/lesson/ai-reflection-coach-notebook";
import { DeveloperNotebook } from "@/components/lesson/developer-notebook";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";
import type { FeedbackState } from "@/lib/lesson-feedback";
import type { LessonStep } from "@/lib/projects";

type ReflectionExperienceProps = {
  variant: LessonVariant;
  step: LessonStep;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
};

export function ReflectionExperience({
  variant,
  step,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
}: ReflectionExperienceProps) {
  if (variant === "ai_coach") {
    return (
      <AiReflectionCoachNotebook
        step={step}
        value={value}
        onChange={onChange}
        status={status}
        statusMessage={statusMessage}
        showSavedPreview={showSavedPreview}
      />
    );
  }

  return (
    <DeveloperNotebook
      prompt={step.reflectionPrompt ?? ""}
      placeholder={step.reflectionPlaceholder}
      value={value}
      onChange={onChange}
      status={status}
      statusMessage={statusMessage}
      showSavedPreview={showSavedPreview}
    />
  );
}
