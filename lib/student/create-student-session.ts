import { getDb } from "@/lib/db";
import { studentSessions } from "@/lib/db/schema";
import { generateStudentSessionToken, hashStudentSessionToken } from "@/lib/security/session-tokens";
import { STUDENT_SESSION_DURATION_MS } from "@/lib/student/session-cookie";

type CreateStudentSessionInput = {
  studentProfileId: string;
  classId: string;
};

export async function createStudentSession({ studentProfileId, classId }: CreateStudentSessionInput) {
  const db = getDb();
  const token = generateStudentSessionToken();
  const tokenHash = hashStudentSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + STUDENT_SESSION_DURATION_MS);

  await db.insert(studentSessions).values({
    studentProfileId,
    classId,
    sessionTokenHash: tokenHash,
    expiresAt,
    lastActiveAt: now,
  });

  return {
    token,
    expiresAt,
  };
}
