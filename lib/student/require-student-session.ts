import { redirect } from "next/navigation";

import { getCurrentStudentSession } from "@/lib/student/get-current-student-session";

export async function requireStudentSession() {
  const session = await getCurrentStudentSession();

  if (!session) {
    redirect("/projects");
  }

  return session;
}
