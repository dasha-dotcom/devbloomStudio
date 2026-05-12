import { cookies } from "next/headers";

import { clearStudentSessionByToken } from "@/lib/student/get-student-session";
import { STUDENT_SESSION_COOKIE_NAME } from "@/lib/student/session-cookie";

export async function clearStudentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(STUDENT_SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await clearStudentSessionByToken(sessionToken);
  }

  cookieStore.delete(STUDENT_SESSION_COOKIE_NAME);
}
