import type { LessonStep } from "@/lib/projects";

type LessonProgressStripProps = {
  steps: LessonStep[];
  currentStep: number;
  completedStepIds: string[];
};

export function LessonProgressStrip({
  steps,
  currentStep,
  completedStepIds,
}: LessonProgressStripProps) {
  const totalSteps = steps.length;
  const activeStep = steps[currentStep] ?? steps[0];
  const activeStepLabel = activeStep?.shortTitle?.trim() || activeStep?.title || `Step ${currentStep + 1}`;
  const completedStepIdSet = new Set(completedStepIds);

  if (!activeStep || totalSteps === 0) {
    return null;
  }

  return (
    <section className="lesson-progress-strip" data-tour-id="lesson-progress" aria-label="Lesson progress">
      <div className="lesson-progress-strip-copy">
        <span className="lesson-progress-strip-kicker">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <strong className="lesson-progress-strip-title">{activeStepLabel}</strong>
      </div>

      <div className="lesson-progress-strip-segments" role="list" aria-label="Lesson step progress">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isDone = completedStepIdSet.has(step.id);
          const segmentState = isDone ? "completed" : isCurrent ? "current" : "upcoming";
          const segmentLabel = step.shortTitle?.trim() || step.title || `Step ${index + 1}`;

          return (
            <span
              key={step.id}
              role="listitem"
              className={`lesson-progress-strip-segment is-${segmentState}`}
              aria-label={`${segmentLabel}: ${segmentState}`}
              title={`${index + 1}. ${segmentLabel}`}
            />
          );
        })}
      </div>
    </section>
  );
}
