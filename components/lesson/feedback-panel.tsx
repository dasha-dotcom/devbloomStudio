import { DeveloperNotebook } from "@/components/lesson/developer-notebook";
import type { FeedbackState } from "@/lib/lesson-feedback";
import type { LessonStep } from "@/lib/projects";

type FeedbackPanelProps = {
  step: LessonStep;
  state: FeedbackState;
  message: string;
  isPending?: boolean;
  onManualCheck?: () => void;
  gateMessage?: string | null;
  reflectionResponse?: string;
  onReflectionChange?: (value: string) => void;
};

const statusLabels: Record<FeedbackState, string> = {
  pass: "On track",
  close: "Almost there",
  notYet: "Keep going",
};

export function FeedbackPanel({
  step,
  state,
  message,
  isPending = false,
  onManualCheck,
  gateMessage,
  reflectionResponse,
  onReflectionChange,
}: FeedbackPanelProps) {
  if (step.feedbackMode === "none") {
    return null;
  }

  return (
    <section className={`feedback-panel feedback-${state}`}>
      {step.feedbackMode === "reflection" ? (
        <DeveloperNotebook
          prompt={step.reflectionPrompt ?? ""}
          placeholder={step.reflectionPlaceholder}
          value={reflectionResponse ?? ""}
          onChange={(value) => onReflectionChange?.(value)}
          status={state}
          statusMessage={message}
          showSavedPreview={state === "pass"}
        />
      ) : (
        <>
          <div className="feedback-topbar">
            <div>
              <div className="prediction-kicker">Step feedback</div>
              <strong className="prediction-question">{statusLabels[state]}</strong>
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
