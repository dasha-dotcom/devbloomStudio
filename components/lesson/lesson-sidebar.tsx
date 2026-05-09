import type { LessonSidebarMeta, LessonStep } from "@/lib/projects";

type LessonSidebarProps = {
  steps: LessonStep[];
  currentStep: number;
  completedStepIds: string[];
  progressPercent: number;
  completedProgressSteps: number;
  totalProgressSteps: number;
  meta: LessonSidebarMeta;
};

export function LessonSidebar({
  steps,
  currentStep,
  completedStepIds,
  progressPercent,
  completedProgressSteps,
  totalProgressSteps,
  meta,
}: LessonSidebarProps) {
  const completedStepIdSet = new Set(completedStepIds);

  return (
    <aside className="lesson-sidebar" data-tour-id="lesson-progress">
      <div className="lesson-meta">
        <span className="eyebrow">{meta.eyebrow}</span>
        <h1 className="lesson-title">{meta.title}</h1>
        <p className="muted">{meta.description}</p>
      </div>

      <div className="progress-meta">
        <div>
          <strong>{progressPercent}% complete</strong>
          <p className="muted">
            {completedProgressSteps} of {totalProgressSteps} progress steps complete
          </p>
        </div>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="checklist">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = completedStepIdSet.has(step.id);

          return (
            <div
              key={step.id}
              className={`checklist-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
            >
              <div className="check-bubble">{isDone ? "✓" : index + 1}</div>
              <div>
                <div className="checklist-label">{step.shortTitle}</div>
                <div className="checklist-copy">{step.sidebarCopy}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
