"use server";

import { redirect } from "next/navigation";

import { clearStudentSession } from "@/lib/student/clear-student-session";

export async function leaveStudentSession() {
  await clearStudentSession();
  redirect("/projects");
}
