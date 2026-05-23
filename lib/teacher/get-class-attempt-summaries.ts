import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { getProjectBySlug } from "@/lib/projects";

export type TeacherClassAttemptSummary = {
  studentId: string;
  attemptCount: number;
  completedCount: number;
  latestActiveAt: Date | null;
  latestProjectTitle: string | null;
  latestProjectStatus: "completed" | "in_progress" | null;
  latestProgressPercent: number | null;
  latestCurrentStepTitle: string | null;
};

export async function getClassAttemptSummaries(classId: string) {
  const db = getDb();

  const rows = await db
    .select({
      studentId: projectAttempts.studentProfileId,
      projectSlug: projectAttempts.projectSlug,
      status: projectAttempts.status,
      progressPercent: projectAttempts.progressPercent,
      currentStepId: projectAttempts.currentStepId,
      lastActiveAt: projectAttempts.lastActiveAt,
      updatedAt: projectAttempts.updatedAt,
    })
    .from(projectAttempts)
    .where(eq(projectAttempts.classId, classId))
    .orderBy(desc(projectAttempts.lastActiveAt), desc(projectAttempts.updatedAt));

  const summaries = new Map<string, TeacherClassAttemptSummary>();

  for (const row of rows) {
    const existingSummary = summaries.get(row.studentId);

    if (!existingSummary) {
      const project = getProjectBySlug(row.projectSlug);
      const projectTitle = project?.projectCard.title ?? row.projectSlug;
      const currentStepTitle = project?.steps.find((step) => step.id === row.currentStepId)?.title ?? row.currentStepId;

      summaries.set(row.studentId, {
        studentId: row.studentId,
        attemptCount: 1,
        completedCount: row.status === "completed" ? 1 : 0,
        latestActiveAt: row.lastActiveAt,
        latestProjectTitle: projectTitle,
        latestProjectStatus: row.status === "completed" ? "completed" : "in_progress",
        latestProgressPercent: row.progressPercent ?? null,
        latestCurrentStepTitle: currentStepTitle,
      });

      continue;
    }

    existingSummary.attemptCount += 1;

    if (row.status === "completed") {
      existingSummary.completedCount += 1;
    }
  }

  return summaries;
}
