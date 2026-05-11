import { asc, count, eq } from "drizzle-orm";

import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";
import { getDb } from "@/lib/db";
import { classes, studentProfiles } from "@/lib/db/schema";

export async function getTeacherClasses() {
  const teacher = await getCurrentTeacher();
  const db = getDb();

  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      joinCode: classes.joinCode,
      isArchived: classes.isArchived,
      createdAt: classes.createdAt,
      updatedAt: classes.updatedAt,
      rosterCount: count(studentProfiles.id),
    })
    .from(classes)
    .leftJoin(studentProfiles, eq(studentProfiles.classId, classes.id))
    .where(eq(classes.teacherId, teacher.id))
    .groupBy(classes.id)
    .orderBy(asc(classes.createdAt));
  return rows;
}
