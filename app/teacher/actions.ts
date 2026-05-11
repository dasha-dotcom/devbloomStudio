"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";
import { getDb } from "@/lib/db";
import { classes, studentProfiles } from "@/lib/db/schema";
import { hashStudentPin, generateStudentPin, isValidStudentPin } from "@/lib/security/pins";
import { generateJoinCode } from "@/lib/teacher/generate-join-code";

type ActionState = {
  error?: string;
  success?: string;
};

export type CreateStudentProfileActionState = ActionState & {
  createdStudentName?: string;
  createdStudentPin?: string;
};

export type CreateClassActionState = ActionState;

const normalizeClassName = (value: string) => value.trim().replace(/\s+/g, " ");
const normalizeStudentName = (value: string) => value.trim().replace(/\s+/g, " ");

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "23505";

async function createUniqueJoinCode(db: ReturnType<typeof getDb>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = generateJoinCode();
    const existingClass = await db.query.classes.findFirst({
      where: eq(classes.joinCode, joinCode),
    });

    if (!existingClass) {
      return joinCode;
    }
  }

  throw new Error("Unable to generate a unique join code.");
}

export async function createClassAction(_previousState: ActionState, formData: FormData): Promise<ActionState> {
  const teacher = await getCurrentTeacher();
  const db = getDb();
  const className = normalizeClassName(String(formData.get("name") ?? ""));

  if (className.length < 2) {
    return {
      error: "Class name must be at least 2 characters.",
    };
  }

  if (className.length > 80) {
    return {
      error: "Class name must be 80 characters or fewer.",
    };
  }

  try {
    const joinCode = await createUniqueJoinCode(db);

    await db.insert(classes).values({
      teacherId: teacher.id,
      name: className,
      joinCode,
    });

    revalidatePath("/teacher");

    return {
      success: `Created class "${className}".`,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to create class.", error);
    }

    return {
      error: "Could not create the class. Try again.",
    };
  }
}

export async function createStudentProfileAction(
  classId: string,
  _previousState: CreateStudentProfileActionState,
  formData: FormData,
): Promise<CreateStudentProfileActionState> {
  const teacher = await getCurrentTeacher();
  const db = getDb();
  const displayName = normalizeStudentName(String(formData.get("displayName") ?? ""));
  const enteredPin = String(formData.get("pin") ?? "").trim();

  const teacherClass = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.teacherId, teacher.id)),
  });

  if (!teacherClass) {
    return {
      error: "Class not found.",
    };
  }

  if (displayName.length < 1) {
    return {
      error: "Student name is required.",
    };
  }

  if (displayName.length > 80) {
    return {
      error: "Student name must be 80 characters or fewer.",
    };
  }

  const rawPin = enteredPin || generateStudentPin();

  if (!isValidStudentPin(rawPin)) {
    return {
      error: "PIN must be exactly 6 digits.",
    };
  }

  try {
    const pinHash = await hashStudentPin(rawPin);

    await db.insert(studentProfiles).values({
      classId: teacherClass.id,
      displayName,
      pinHash,
      isActive: true,
    });

    revalidatePath("/teacher");
    revalidatePath(`/teacher/classes/${teacherClass.id}`);

    return {
      success: `Created student "${displayName}".`,
      createdStudentName: displayName,
      createdStudentPin: rawPin,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to create student profile.", error);
    }

    if (isUniqueViolation(error)) {
      return {
        error: "A student with that information could not be created. Try again.",
      };
    }

    return {
      error: "Could not create the student profile. Try again.",
    };
  }
}
