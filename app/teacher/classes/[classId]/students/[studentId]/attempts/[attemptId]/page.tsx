import { LivePreview } from "@/components/lesson/live-preview";
import { getProjectBySlug } from "@/lib/projects";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import { deriveTeacherAttemptSummary, type TeacherAttemptStepSummary } from "@/lib/teacher/derive-attempt-summary";
import { requireTeacherProjectAttempt } from "@/lib/teacher/require-teacher-project-attempt";

type TeacherAttemptDetailPageProps = {
  params: Promise<{
    classId: string;
    studentId: string;
    attemptId: string;
  }>;
};

const getTeacherPreviewSandbox = (sandbox: string | undefined) =>
  (sandbox ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => token !== "allow-same-origin")
    .join(" ");

const formatApproximateDuration = (durationMs: number | null) => {
  if (durationMs === null || durationMs < 0) {
    return "Unknown";
  }

  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

const getStepSignalPills = (step: TeacherAttemptStepSummary) => {
  const pills = [
    step.isCurrent ? "Current" : null,
    step.isCompleted ? "Completed" : step.isVisited ? "Visited" : "Not visited",
    step.predictionStatus === "answered"
      ? "Prediction answered"
      : step.predictionStatus === "pending"
        ? "Prediction pending"
        : null,
    step.checkpointStatus === "pass"
      ? "Checkpoint passed"
      : step.checkpointStatus === "close"
        ? "Checkpoint close"
        : step.checkpointStatus === "pending"
          ? "Checkpoint pending"
          : null,
    step.reflectionStatus === "complete"
      ? "Reflection complete"
      : step.reflectionStatus === "pending"
        ? "Reflection pending"
        : null,
  ];

  return pills.filter((pill): pill is string => Boolean(pill));
};

export default async function TeacherAttemptDetailPage({ params }: TeacherAttemptDetailPageProps) {
  const { classId, studentId, attemptId } = await params;
  const { teacherStudent, attemptRow } = await requireTeacherProjectAttempt(classId, studentId, attemptId);
  const project = getProjectBySlug(attemptRow.projectSlug);

  if (!project) {
    return (
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Attempt detail</span>
            <h1 className="section-title">{attemptRow.projectSlug}</h1>
          </div>
          <p className="section-copy">{teacherStudent.displayName}</p>
        </div>

        <div className="glass-card teacher-panel">
          <strong>Attempt data</strong>
          <p className="muted teacher-panel-copy">
            This project configuration is not available in the current app build, so only summary metadata can be
            shown.
          </p>
        </div>
      </section>
    );
  }

  const normalizedAttempt = normalizeProjectAttempt(project, attemptRow.stateJson);
  const derivedSummary = normalizedAttempt ? deriveTeacherAttemptSummary(project, normalizedAttempt) : null;
  const currentStepId = normalizedAttempt?.currentStepId ?? attemptRow.currentStepId;
  const currentStep = project.steps.find((step) => step.id === currentStepId);
  const reflectionEntries =
    normalizedAttempt
      ? project.steps
          .map((step) => {
            const response = normalizedAttempt.reflectionResponses[step.id]?.trim();

            if (!response) {
              return null;
            }

            return {
              stepId: step.id,
              stepTitle: step.shortTitle,
              prompt: step.reflectionPrompt ?? step.title,
              response,
            };
          })
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : [];
  const previewDoc = normalizedAttempt
    ? project.buildPreviewDocument({
        code: normalizedAttempt.latestCode,
        selectedThemeId: normalizedAttempt.selectedThemeId,
        selectedImageId: normalizedAttempt.selectedImageId,
      })
    : null;
  const previewTitle = normalizedAttempt && project.previewTitle
    ? project.previewTitle({
        selectedThemeId: normalizedAttempt.selectedThemeId,
        selectedImageId: normalizedAttempt.selectedImageId,
      })
    : project.projectCard.title;
  const previewSandbox = getTeacherPreviewSandbox(project.previewSandbox);
  const isAttemptDataUnavailable = attemptRow.contentVersion !== project.contentVersion || !normalizedAttempt;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Attempt detail</span>
          <h1 className="section-title">{project.projectCard.title}</h1>
        </div>
        <p className="section-copy">
          {teacherStudent.displayName} • {teacherStudent.className}
        </p>
      </div>

      <div className="teacher-grid">
        <div className="glass-card teacher-panel">
          <strong>Attempt summary</strong>
          <div className="teacher-meta-grid teacher-attempt-meta-grid">
            <div className="teacher-meta-card">
              <span className="muted">Status</span>
              <strong>{attemptRow.status === "completed" ? "Completed" : "In progress"}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Progress</span>
              <strong>{derivedSummary?.progressPercent ?? attemptRow.progressPercent ?? 0}%</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Current step</span>
              <strong>{derivedSummary?.currentStepTitle ?? currentStep?.title ?? attemptRow.currentStepId}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Started</span>
              <strong>{derivedSummary?.startedAt?.toLocaleString() ?? "Unknown"}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Last active</span>
              <strong>{attemptRow.lastActiveAt.toLocaleString()}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Approx. duration</span>
              <strong>{formatApproximateDuration(derivedSummary?.approximateDurationMs ?? null)}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Finished</span>
              <strong>{attemptRow.finishedAt ? attemptRow.finishedAt.toLocaleString() : "Not finished"}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Visited steps</span>
              <strong>
                {derivedSummary ? `${derivedSummary.visitedStepIds.length}/${project.steps.length}` : "Unavailable"}
              </strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Completed steps</span>
              <strong>
                {derivedSummary
                  ? `${derivedSummary.completedProgressSteps}/${derivedSummary.totalProgressSteps}`
                  : "Unavailable"}
              </strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Predictions</span>
              <strong>
                {derivedSummary
                  ? `${derivedSummary.predictionSummary.answeredCount}/${derivedSummary.predictionSummary.totalCount} answered`
                  : "Unavailable"}
              </strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Checkpoints</span>
              <strong>
                {derivedSummary
                  ? `${derivedSummary.checkpointSummary.passedCount}/${derivedSummary.checkpointSummary.totalCount} passed`
                  : "Unavailable"}
              </strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Reflections</span>
              <strong>
                {derivedSummary
                  ? `${derivedSummary.reflectionSummary.completedCount}/${derivedSummary.reflectionSummary.totalCount} complete`
                  : "Unavailable"}
              </strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Likely friction</span>
              <strong>{derivedSummary?.likelyFrictionPoint?.stepTitle ?? "No clear blocker"}</strong>
              {derivedSummary?.likelyFrictionPoint ? (
                <p className="muted teacher-panel-copy" style={{ marginTop: 8 }}>
                  {derivedSummary.likelyFrictionPoint.summary}
                </p>
              ) : null}
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Latest reflection</span>
              <strong>{attemptRow.latestReflectionExcerpt ?? "No reflection yet"}</strong>
            </div>
          </div>

          {isAttemptDataUnavailable ? (
            <div className="teacher-attempt-fallback">
              <strong>Read-only preview unavailable</strong>
              <p className="muted teacher-panel-copy">
                Saved attempt data could not be fully restored against the current static project config, so preview
                and full reflection details are limited on this page.
              </p>
            </div>
          ) : null}
        </div>

        {previewDoc ? (
          <LivePreview
            label="Read-only preview"
            description="Sandboxed view of the student's saved work."
            title={previewTitle}
            srcDoc={previewDoc}
            sandbox={previewSandbox}
          />
        ) : (
          <div className="lesson-preview-card teacher-panel">
            <div className="preview-label">
              <div>
                <strong>Read-only preview</strong>
                <p className="muted">Preview is unavailable for this saved attempt.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {derivedSummary ? (
        <div className="glass-card teacher-panel" style={{ marginTop: 24 }}>
          <strong>Step walkthrough</strong>
          <p className="muted teacher-panel-copy">
            Derived from the current saved attempt snapshot. This shows where the student has been, what is complete,
            and what still looks pending on the current step.
          </p>

          <div className="teacher-list">
            {derivedSummary.steps.map((stepSummary) => {
              const signalPills = getStepSignalPills(stepSummary);
              const isCurrentFrictionStep = derivedSummary.likelyFrictionPoint?.stepId === stepSummary.stepId;

              return (
                <article key={stepSummary.stepId} className="teacher-list-item">
                  <div>
                    <strong>
                      Step {stepSummary.stepOrder}: {stepSummary.stepTitle}
                    </strong>
                    {signalPills.length > 0 ? (
                      <div className="pill-row" style={{ marginTop: 10 }}>
                        {signalPills.map((pill) => (
                          <span key={pill} className="pill">
                            {pill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="muted teacher-list-copy teacher-attempt-summary" style={{ marginTop: 10 }}>
                      {stepSummary.canGoNext ? "Can move on from saved state." : "Still blocked from moving on in saved state."}
                    </p>
                    {isCurrentFrictionStep ? (
                      <p className="muted teacher-list-copy teacher-attempt-summary">
                        {derivedSummary.likelyFrictionPoint?.detail}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="glass-card teacher-panel" style={{ marginTop: 24 }}>
        <strong>Reflection details</strong>
        {reflectionEntries.length === 0 ? (
          <p className="muted teacher-panel-copy">No full reflection responses are available for this attempt.</p>
        ) : (
          <div className="teacher-reflection-list">
            {reflectionEntries.map((entry) => (
              <div key={entry.stepId} className="teacher-reflection-card">
                <span className="muted teacher-reflection-kicker">{entry.stepTitle}</span>
                <strong>{entry.prompt}</strong>
                <p className="teacher-reflection-response">{entry.response}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
