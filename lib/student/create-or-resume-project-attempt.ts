import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { getProjectBySlug } from "@/lib/projects";
import { buildFreshStudentProjectAttempt, buildProjectAttemptRecordValues } from "@/lib/student/project-attempt-record";

type CreateOrResumeProjectAttemptInput = {
  studentProfileId: string;
  classId: string;
  projectSlug: string;
};

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "23505";

export async function createOrResumeProjectAttempt({
  studentProfileId,
  classId,
  projectSlug,
}: CreateOrResumeProjectAttemptInput) {
  const project = getProjectBySlug(projectSlug);

  if (!project) {
    return null;
  }

  const db = getDb();
  const existingAttempt = await db.query.projectAttempts.findFirst({
    where: and(
      eq(projectAttempts.studentProfileId, studentProfileId),
      eq(projectAttempts.projectSlug, project.slug),
      eq(projectAttempts.contentVersion, project.contentVersion),
    ),
  });

  if (existingAttempt) {
    return {
      attemptId: existingAttempt.id,
      project,
    };
  }

  const attemptId = crypto.randomUUID();
  const freshAttempt = buildFreshStudentProjectAttempt(project, attemptId);

  try {
    await db.insert(projectAttempts).values(
      buildProjectAttemptRecordValues({
        attempt: freshAttempt,
        classId,
        studentProfileId,
        project,
      }),
    );
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const resumedAttempt = await db.query.projectAttempts.findFirst({
      where: and(
        eq(projectAttempts.studentProfileId, studentProfileId),
        eq(projectAttempts.projectSlug, project.slug),
        eq(projectAttempts.contentVersion, project.contentVersion),
      ),
    });

    if (!resumedAttempt) {
      throw error;
    }

    return {
      attemptId: resumedAttempt.id,
      project,
    };
  }

  return {
    attemptId,
    project,
  };
}
