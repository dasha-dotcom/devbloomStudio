import { eq, lt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { classes, studentProfiles, studentSessions } from "@/lib/db/schema";
import { hashStudentSessionToken } from "@/lib/security/session-tokens";

const LAST_ACTIVE_REFRESH_MS = 5 * 60 * 1000;

export async function getStudentSession(sessionToken: string) {
  const db = getDb();
  const tokenHash = hashStudentSessionToken(sessionToken);
  const now = new Date();

  const rows = await db
    .select({
      sessionId: studentSessions.id,
      sessionClassId: studentSessions.classId,
      sessionStudentProfileId: studentSessions.studentProfileId,
      expiresAt: studentSessions.expiresAt,
      lastActiveAt: studentSessions.lastActiveAt,
      studentId: studentProfiles.id,
      studentDisplayName: studentProfiles.displayName,
      studentIsActive: studentProfiles.isActive,
      classId: classes.id,
      className: classes.name,
      classJoinCode: classes.joinCode,
      classIsArchived: classes.isArchived,
    })
    .from(studentSessions)
    .innerJoin(studentProfiles, eq(studentSessions.studentProfileId, studentProfiles.id))
    .innerJoin(classes, eq(studentSessions.classId, classes.id))
    .where(eq(studentSessions.sessionTokenHash, tokenHash))
    .limit(1);

  const session = rows[0];

  if (!session) {
    return null;
  }

  if (session.expiresAt <= now || !session.studentIsActive || session.classIsArchived) {
    await db.delete(studentSessions).where(eq(studentSessions.id, session.sessionId));
    return null;
  }

  if (now.getTime() - session.lastActiveAt.getTime() > LAST_ACTIVE_REFRESH_MS) {
    await db
      .update(studentSessions)
      .set({
        lastActiveAt: now,
      })
      .where(eq(studentSessions.id, session.sessionId));
  }

  return session;
}

export async function clearStudentSessionByToken(sessionToken: string) {
  const db = getDb();
  const tokenHash = hashStudentSessionToken(sessionToken);

  await db.delete(studentSessions).where(eq(studentSessions.sessionTokenHash, tokenHash));
}

export async function clearExpiredStudentSessions() {
  const db = getDb();
  await db.delete(studentSessions).where(lt(studentSessions.expiresAt, new Date()));
}
