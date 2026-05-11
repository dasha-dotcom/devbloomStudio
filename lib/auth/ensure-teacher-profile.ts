import { eq, type InferSelectModel } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { requireTeacherUser } from "@/lib/auth/require-teacher-user";

type TeacherRecord = InferSelectModel<typeof teachers>;

const getDisplayName = (email: string | undefined) => {
  if (!email) {
    return null;
  }

  return email.split("@")[0] ?? null;
};

export async function ensureTeacherProfile(): Promise<TeacherRecord> {
  const user = await requireTeacherUser();
  const db = getDb();

  const existingTeacher = await db.query.teachers.findFirst({
    where: eq(teachers.supabaseAuthUserId, user.id),
  });

  if (existingTeacher) {
    if (existingTeacher.email !== (user.email ?? existingTeacher.email)) {
      const [updatedTeacher] = await db
        .update(teachers)
        .set({
          email: user.email ?? existingTeacher.email,
          displayName: existingTeacher.displayName ?? getDisplayName(user.email),
        })
        .where(eq(teachers.id, existingTeacher.id))
        .returning();

      return updatedTeacher;
    }

    return existingTeacher;
  }

  const [createdTeacher] = await db
    .insert(teachers)
    .values({
      supabaseAuthUserId: user.id,
      email: user.email ?? "",
      displayName: getDisplayName(user.email),
    })
    .returning();

  return createdTeacher;
}
