import { AiReflectionCoachNotebook } from "@/components/lesson/ai-reflection-coach-notebook";
import { DeveloperNotebook } from "@/components/lesson/developer-notebook";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";
import type { FeedbackState } from "@/lib/lesson-feedback";
import type { ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import type { LessonStep } from "@/lib/projects";

type ReflectionExperienceProps = {
  projectSlug: string;
  variant: LessonVariant;
  step: LessonStep;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
  onCoachCheck?: (check: ReflectionCoachCheck) => void;
};

export function ReflectionExperience({
  projectSlug,
  variant,
  step,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
  onCoachCheck,
}: ReflectionExperienceProps) {
  if (variant === "ai_coach") {
    return (
      <AiReflectionCoachNotebook
        projectSlug={projectSlug}
        step={step}
        value={value}
        onChange={onChange}
        status={status}
        statusMessage={statusMessage}
        showSavedPreview={showSavedPreview}
        onCoachCheck={onCoachCheck}
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
