import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { getProjectBySlug } from "@/lib/projects";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import { buildFreshStudentProjectAttempt, buildProjectAttemptRecordValues } from "@/lib/student/project-attempt-record";
import { requireStudentSession } from "@/lib/student/require-student-session";

export async function requireStudentProjectAttempt(attemptId: string) {
  const session = await requireStudentSession();
  const db = getDb();

  const attemptRow = await db.query.projectAttempts.findFirst({
    where: and(eq(projectAttempts.id, attemptId), eq(projectAttempts.studentProfileId, session.studentId)),
  });

  if (!attemptRow) {
    notFound();
  }

  const project = getProjectBySlug(attemptRow.projectSlug);

  if (!project) {
    notFound();
  }

  if (attemptRow.contentVersion !== project.contentVersion) {
    redirect("/student/projects");
  }

  let attempt = normalizeProjectAttempt(project, attemptRow.stateJson);

  if (!attempt) {
    attempt = buildFreshStudentProjectAttempt(project, attemptRow.id);

    await db
      .update(projectAttempts)
      .set(
        buildProjectAttemptRecordValues({
          attempt,
          classId: session.classId,
          studentProfileId: session.studentId,
          project,
        }),
      )
      .where(eq(projectAttempts.id, attemptRow.id));
  }

  return {
    session,
    project,
    attempt,
    attemptRow,
  };
}
