import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { requireTeacherStudent } from "@/lib/teacher/require-teacher-student";

export async function requireTeacherProjectAttempt(classId: string, studentId: string, attemptId: string) {
  const { teacher, teacherStudent } = await requireTeacherStudent(classId, studentId);
  const db = getDb();

  const attemptRow = await db.query.projectAttempts.findFirst({
    where: and(
      eq(projectAttempts.id, attemptId),
      eq(projectAttempts.studentProfileId, teacherStudent.studentId),
      eq(projectAttempts.classId, teacherStudent.classId),
    ),
  });

  if (!attemptRow) {
    notFound();
  }

  return {
    teacher,
    teacherStudent,
    attemptRow,
  };
}
