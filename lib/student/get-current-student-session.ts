import { cookies } from "next/headers";

import { getStudentSession } from "@/lib/student/get-student-session";
import { STUDENT_SESSION_COOKIE_NAME } from "@/lib/student/session-cookie";

export async function getCurrentStudentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(STUDENT_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getStudentSession(sessionToken);
}
