import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import { getProjectBySlug } from "@/lib/projects";
import { deriveTeacherAttemptSummary } from "@/lib/teacher/derive-attempt-summary";

export type TeacherStudentAttempt = {
  id: string;
  projectSlug: string;
  projectTitle: string;
  contentVersion: string;
  status: string;
  progressPercent: number | null;
  currentStepId: string;
  currentStepTitle: string;
  startedAt: Date | null;
  lastActiveAt: Date;
  finishedAt: Date | null;
  latestReflectionExcerpt: string | null;
};

export async function getStudentAttempts(classId: string, studentId: string) {
  const db = getDb();

  const rows = await db.query.projectAttempts.findMany({
    where: and(eq(projectAttempts.classId, classId), eq(projectAttempts.studentProfileId, studentId)),
    orderBy: [desc(projectAttempts.lastActiveAt), desc(projectAttempts.updatedAt)],
  });

  return rows.map((attempt) => {
    const project = getProjectBySlug(attempt.projectSlug);
    const normalizedAttempt = project ? normalizeProjectAttempt(project, attempt.stateJson) : null;
    const derivedSummary =
      project && normalizedAttempt ? deriveTeacherAttemptSummary(project, normalizedAttempt) : null;
    const currentStepId = derivedSummary?.currentStepId ?? attempt.currentStepId;
    const currentStep = project?.steps.find((step) => step.id === currentStepId);

    return {
      id: attempt.id,
      projectSlug: attempt.projectSlug,
      projectTitle: project?.projectCard.title ?? attempt.projectSlug,
      contentVersion: attempt.contentVersion,
      status: attempt.status,
      progressPercent: derivedSummary?.progressPercent ?? attempt.progressPercent ?? null,
      currentStepId,
      currentStepTitle: currentStep?.title ?? currentStepId,
      startedAt: derivedSummary?.startedAt ?? null,
      lastActiveAt: attempt.lastActiveAt,
      finishedAt: attempt.finishedAt,
      latestReflectionExcerpt: attempt.latestReflectionExcerpt ?? null,
    } satisfies TeacherStudentAttempt;
  });
}
