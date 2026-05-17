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
};

export async function getClassAttemptSummaries(classId: string) {
  const db = getDb();

  const rows = await db
    .select({
      studentId: projectAttempts.studentProfileId,
      projectSlug: projectAttempts.projectSlug,
      status: projectAttempts.status,
      progressPercent: projectAttempts.progressPercent,
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
      const projectTitle = getProjectBySlug(row.projectSlug)?.projectCard.title ?? row.projectSlug;

      summaries.set(row.studentId, {
        studentId: row.studentId,
        attemptCount: 1,
        completedCount: row.status === "completed" ? 1 : 0,
        latestActiveAt: row.lastActiveAt,
        latestProjectTitle: projectTitle,
        latestProjectStatus: row.status === "completed" ? "completed" : "in_progress",
        latestProgressPercent: row.progressPercent ?? null,
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
