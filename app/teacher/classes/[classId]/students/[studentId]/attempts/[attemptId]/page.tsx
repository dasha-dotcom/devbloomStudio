import { LivePreview } from "@/components/lesson/live-preview";
import { getProjectBySlug } from "@/lib/projects";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
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
              <strong>{attemptRow.progressPercent ?? 0}%</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Current step</span>
              <strong>{currentStep?.title ?? attemptRow.currentStepId}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Last active</span>
              <strong>{attemptRow.lastActiveAt.toLocaleString()}</strong>
            </div>
            <div className="teacher-meta-card">
              <span className="muted">Finished</span>
              <strong>{attemptRow.finishedAt ? attemptRow.finishedAt.toLocaleString() : "Not finished"}</strong>
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
