import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";
import { getDb } from "@/lib/db";
import { classes } from "@/lib/db/schema";

export async function requireTeacherClass(classId: string) {
  const teacher = await getCurrentTeacher();
  const db = getDb();

  const teacherClass = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.teacherId, teacher.id)),
  });

  if (!teacherClass) {
    notFound();
  }

  return {
    teacher,
    teacherClass,
  };
}
