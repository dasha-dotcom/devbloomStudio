import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { getProjectBySlug } from "@/lib/projects";

export type TeacherStudentAttempt = {
  id: string;
  projectSlug: string;
  projectTitle: string;
  contentVersion: string;
  status: string;
  progressPercent: number | null;
  currentStepId: string;
  currentStepTitle: string;
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
    const currentStep =
      project?.steps.find((step) => step.id === attempt.currentStepId);

    return {
      id: attempt.id,
      projectSlug: attempt.projectSlug,
      projectTitle: project?.projectCard.title ?? attempt.projectSlug,
      contentVersion: attempt.contentVersion,
      status: attempt.status,
      progressPercent: attempt.progressPercent ?? null,
      currentStepId: attempt.currentStepId,
      currentStepTitle: currentStep?.title ?? attempt.currentStepId,
      lastActiveAt: attempt.lastActiveAt,
      finishedAt: attempt.finishedAt,
      latestReflectionExcerpt: attempt.latestReflectionExcerpt ?? null,
    } satisfies TeacherStudentAttempt;
  });
}
