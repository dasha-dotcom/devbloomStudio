import { AppShell } from "@/components/app-shell";
import { ensureTeacherProfile } from "@/lib/auth/ensure-teacher-profile";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureTeacherProfile();

  return <AppShell>{children}</AppShell>;
}
