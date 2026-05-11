import { ensureTeacherProfile } from "@/lib/auth/ensure-teacher-profile";

export async function getCurrentTeacher() {
  return ensureTeacherProfile();
}
