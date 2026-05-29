"use server";

import { notFound, redirect } from "next/navigation";

import { normalizeLessonVariant } from "@/lib/experiments/lesson-variant";
import { createOrResumeProjectAttempt } from "@/lib/student/create-or-resume-project-attempt";
import { requireStudentSession } from "@/lib/student/require-student-session";

export async function launchStudentProjectAttempt(projectSlug: string) {
  const session = await requireStudentSession();
  const projectAttempt = await createOrResumeProjectAttempt({
    studentProfileId: session.studentId,
    classId: session.classId,
    projectSlug,
    variant: normalizeLessonVariant(session.classDefaultVariant),
  });

  if (!projectAttempt) {
    notFound();
  }

  redirect(`/student/attempts/${projectAttempt.attemptId}`);
}
