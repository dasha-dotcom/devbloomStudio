"use server";

import { and, asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
import { classes, studentProfiles } from "@/lib/db/schema";
import { verifyStudentPin, isValidStudentPin } from "@/lib/security/pins";
import { clearStudentSession } from "@/lib/student/clear-student-session";
import { createStudentSession } from "@/lib/student/create-student-session";
import { getStudentSessionCookieOptions, STUDENT_SESSION_COOKIE_NAME } from "@/lib/student/session-cookie";

export type JoinStudentActionState = {
  error?: string;
};

const normalizeClassCode = (value: string) => value.trim().toUpperCase();

export async function goToJoinClassPage(formData: FormData) {
  const classCode = normalizeClassCode(String(formData.get("classCode") ?? ""));

  if (!classCode) {
    redirect("/join");
  }

  redirect(`/join/${classCode}`);
}

export async function joinStudentClassAction(
  classCode: string,
  _previousState: JoinStudentActionState,
  formData: FormData,
): Promise<JoinStudentActionState> {
  const normalizedClassCode = normalizeClassCode(classCode);
  const selectedStudentId = String(formData.get("studentId") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const db = getDb();

  const teacherClass = await db.query.classes.findFirst({
    where: and(eq(classes.joinCode, normalizedClassCode), eq(classes.isArchived, false)),
  });

  if (!teacherClass || !selectedStudentId || !isValidStudentPin(pin)) {
    return {
      error: "That student name and PIN did not match.",
    };
  }

  const studentProfile = await db.query.studentProfiles.findFirst({
    where: and(
      eq(studentProfiles.id, selectedStudentId),
      eq(studentProfiles.classId, teacherClass.id),
      eq(studentProfiles.isActive, true),
    ),
  });

  if (!studentProfile) {
    return {
      error: "That student name and PIN did not match.",
    };
  }

  const pinMatches = await verifyStudentPin(pin, studentProfile.pinHash);

  if (!pinMatches) {
    return {
      error: "That student name and PIN did not match.",
    };
  }

  await clearStudentSession();

  const { token, expiresAt } = await createStudentSession({
    studentProfileId: studentProfile.id,
    classId: teacherClass.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_SESSION_COOKIE_NAME, token, getStudentSessionCookieOptions(expiresAt));

  redirect("/student/projects");
}

export async function getJoinPageData(classCode: string) {
  const normalizedClassCode = normalizeClassCode(classCode);
  const db = getDb();

  const teacherClass = await db.query.classes.findFirst({
    where: and(eq(classes.joinCode, normalizedClassCode), eq(classes.isArchived, false)),
  });

  if (!teacherClass) {
    return null;
  }

  const activeStudents = await db.query.studentProfiles.findMany({
    where: and(eq(studentProfiles.classId, teacherClass.id), eq(studentProfiles.isActive, true)),
    orderBy: [asc(studentProfiles.displayName), asc(studentProfiles.createdAt)],
  });

  return {
    teacherClass,
    activeStudents,
  };
}
