import type { LessonSidebarMeta, LessonStep } from "@/lib/projects";

type LessonSidebarProps = {
  steps: LessonStep[];
  currentStep: number;
  meta: LessonSidebarMeta;
};

export function LessonSidebar({ steps, currentStep, meta }: LessonSidebarProps) {
  const progress = Math.round((currentStep / Math.max(steps.length - 1, 1)) * 100);

  return (
    <aside className="lesson-sidebar">
      <div className="lesson-meta">
        <span className="eyebrow">{meta.eyebrow}</span>
        <h1 className="lesson-title">{meta.title}</h1>
        <p className="muted">{meta.description}</p>
      </div>

      <div className="progress-meta">
        <div>
          <strong>{progress}% complete</strong>
          <p className="muted">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="checklist">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;

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
