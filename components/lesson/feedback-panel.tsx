import { ReflectionExperience } from "@/components/lesson/reflection-experience";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";
import type { FeedbackState } from "@/lib/lesson-feedback";
import type { ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import type { LessonStep } from "@/lib/projects";

type FeedbackPanelProps = {
  projectSlug: string;
  variant: LessonVariant;
  step: LessonStep;
  state: FeedbackState;
  message: string;
  isPending?: boolean;
  onManualCheck?: () => void;
  gateMessage?: string | null;
  reflectionResponse?: string;
  onReflectionChange?: (value: string) => void;
  onReflectionCoachCheck?: (check: ReflectionCoachCheck) => void;
};

const statusLabels: Record<FeedbackState, string> = {
  pass: "On track",
  close: "Almost there",
  notYet: "Keep going",
};

export function FeedbackPanel({
  projectSlug,
  variant,
  step,
  state,
  message,
  isPending = false,
  onManualCheck,
  gateMessage,
  reflectionResponse,
  onReflectionChange,
  onReflectionCoachCheck,
}: FeedbackPanelProps) {
  if (step.feedbackMode === "none") {
    return null;
  }

  return (
    <section className={`feedback-panel feedback-${state}`}>
      {step.feedbackMode === "reflection" ? (
        <ReflectionExperience
          projectSlug={projectSlug}
          variant={variant}
          step={step}
          value={reflectionResponse ?? ""}
          onChange={(value) => onReflectionChange?.(value)}
          status={state}
          statusMessage={message}
          showSavedPreview={state === "pass"}
          onCoachCheck={onReflectionCoachCheck}
        />
      ) : (
        <>
          <div className="feedback-topbar">
            <div>
              <div className="prediction-kicker">Step feedback</div>
              <strong className="prediction-question">{statusLabels[state]}</strong>
            </div>
            <div className="feedback-status-mark" aria-hidden="true">
              <span className="feedback-status-box">
                <span className="feedback-status-check" />
              </span>
            </div>
          </div>
          <p className="prediction-feedback feedback-copy">{message}</p>
          {onManualCheck ? (
            <div className="checkpoint-actions">
              <button type="button" className="button" onClick={onManualCheck}>
                {isPending ? "Check my step" : "Check again"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {gateMessage ? <p className="feedback-gate-note">{gateMessage}</p> : null}
    </section>
  );
}
