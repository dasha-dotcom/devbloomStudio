import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";
import { getDb } from "@/lib/db";
import { classes, studentProfiles } from "@/lib/db/schema";

export async function requireTeacherStudent(classId: string, studentId: string) {
  const teacher = await getCurrentTeacher();
  const db = getDb();

  const student = await db
    .select({
      studentId: studentProfiles.id,
      displayName: studentProfiles.displayName,
      isActive: studentProfiles.isActive,
      createdAt: studentProfiles.createdAt,
      updatedAt: studentProfiles.updatedAt,
      classId: classes.id,
      className: classes.name,
      joinCode: classes.joinCode,
      teacherId: classes.teacherId,
    })
    .from(studentProfiles)
    .innerJoin(classes, eq(studentProfiles.classId, classes.id))
    .where(
      and(
        eq(studentProfiles.id, studentId),
        eq(studentProfiles.classId, classId),
        eq(classes.teacherId, teacher.id),
      ),
    )
    .limit(1);

  const teacherStudent = student[0];

  if (!teacherStudent) {
    notFound();
  }

  return {
    teacher,
    teacherStudent,
  };
}
