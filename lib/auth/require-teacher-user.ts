import { redirect } from "next/navigation";

import { getTeacherUser } from "@/lib/auth/get-teacher-user";

export async function requireTeacherUser() {
  const user = await getTeacherUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}
