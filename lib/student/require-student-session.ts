import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getStudentSession } from "@/lib/student/get-student-session";
import { STUDENT_SESSION_COOKIE_NAME } from "@/lib/student/session-cookie";

export async function requireStudentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(STUDENT_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect("/projects");
  }

  const session = await getStudentSession(sessionToken);

  if (!session) {
    redirect("/projects");
  }

  return session;
}
