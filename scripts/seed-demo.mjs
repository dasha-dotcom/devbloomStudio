import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

import { config as loadEnv } from "dotenv";
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });
loadEnv();

const projectRoot = path.resolve(import.meta.dirname, "..");

const resolveAliasPath = (specifier) => {
  const relativePath = specifier.slice(2);
  const basePath = path.join(projectRoot, relativePath);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    basePath,
  ];

  return candidates.find((candidate) => existsSync(candidate) && !statSync(candidate).isDirectory());
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolvedPath = resolveAliasPath(specifier);

      if (!resolvedPath) {
        throw new Error(`Could not resolve alias import "${specifier}".`);
      }

      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }

    return nextResolve(specifier, context);
  },
});

const DEMO_TEACHER_EMAIL = "demo-teacher@devbloom.local";
const DEMO_TEACHER_PASSWORD = "DevBloomDemo123!";
const DEMO_TEACHER_DISPLAY_NAME = "Demo Teacher";
const DEMO_CLASSES = [
  {
    name: "Demo Class",
    joinCode: "DEMO25",
    defaultVariant: "control",
  },
  {
    name: "Demo AI Class",
    joinCode: "AIDEMO",
    defaultVariant: "ai_coach",
  },
];
const DEMO_STUDENTS = [
  {
    displayName: "Ava Demo",
    pin: "123456",
  },
  {
    displayName: "Leo Demo",
    pin: "234567",
  },
  {
    displayName: "Maya Demo",
    pin: "345678",
  },
];

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
};

const getStepForOffset = (project, offset) => {
  if (project.steps.length === 0) {
    throw new Error(`Project "${project.slug}" does not define any steps.`);
  }

  if (offset < 0) {
    return project.steps.at(offset) ?? project.steps[0];
  }

  return project.steps[Math.min(offset, project.steps.length - 1)] ?? project.steps[0];
};

const getStepEditorTabId = (step, fallback) => step.defaultEditorTabId ?? step.editorTabs?.[0]?.id ?? fallback;

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

async function findAuthUserByEmail(supabaseAdmin, email) {
  const normalizedEmail = email.toLowerCase();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list Supabase auth users: ${error.message}`);
    }

    const matchedUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

    if (matchedUser) {
      return matchedUser;
    }

    if (!data.nextPage || data.users.length < perPage) {
      return null;
    }

    page = data.nextPage;
  }
}

async function ensureDemoAuthUser(supabaseAdmin) {
  const existingUser = await findAuthUserByEmail(supabaseAdmin, DEMO_TEACHER_EMAIL);
  const userPayload = {
    email: DEMO_TEACHER_EMAIL,
    password: DEMO_TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: DEMO_TEACHER_DISPLAY_NAME,
      demo_seed: true,
    },
  };

  if (existingUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, userPayload);

    if (error || !data.user) {
      throw new Error(`Failed to update demo teacher auth user: ${error?.message ?? "Unknown error."}`);
    }

    return data.user;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser(userPayload);

  if (error || !data.user) {
    throw new Error(`Failed to create demo teacher auth user: ${error?.message ?? "Unknown error."}`);
  }

  return data.user;
}

async function ensureDemoTeacherRecord(db, teachers, authUser) {
  const teacherByAuthId = await db.query.teachers.findFirst({
    where: eq(teachers.supabaseAuthUserId, authUser.id),
  });
  const teacherByEmail = await db.query.teachers.findFirst({
    where: eq(teachers.email, DEMO_TEACHER_EMAIL),
  });

  if (teacherByAuthId && teacherByEmail && teacherByAuthId.id !== teacherByEmail.id) {
    throw new Error(
      `Conflicting teacher rows found for ${DEMO_TEACHER_EMAIL}. Resolve the duplicate teacher records before seeding demo data.`,
    );
  }

  const existingTeacher = teacherByAuthId ?? teacherByEmail;

  if (existingTeacher) {
    const needsUpdate =
      existingTeacher.supabaseAuthUserId !== authUser.id ||
      existingTeacher.email !== DEMO_TEACHER_EMAIL ||
      existingTeacher.displayName !== DEMO_TEACHER_DISPLAY_NAME;

    if (!needsUpdate) {
      return existingTeacher;
    }

    const [updatedTeacher] = await db
      .update(teachers)
      .set({
        supabaseAuthUserId: authUser.id,
        email: DEMO_TEACHER_EMAIL,
        displayName: DEMO_TEACHER_DISPLAY_NAME,
      })
      .where(eq(teachers.id, existingTeacher.id))
      .returning();

    return updatedTeacher;
  }

  const [createdTeacher] = await db
    .insert(teachers)
    .values({
      supabaseAuthUserId: authUser.id,
      email: DEMO_TEACHER_EMAIL,
      displayName: DEMO_TEACHER_DISPLAY_NAME,
    })
    .returning();

  return createdTeacher;
}

async function ensureDemoClasses(db, classes, teacher) {
  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, teacher.id),
    orderBy: [asc(classes.createdAt)],
  });
  const usedClassIds = new Set();
  const demoClasses = [];

  for (const demoClassConfig of DEMO_CLASSES) {
    const classUsingDemoCode = await db.query.classes.findFirst({
      where: eq(classes.joinCode, demoClassConfig.joinCode),
    });

    if (classUsingDemoCode && classUsingDemoCode.teacherId !== teacher.id) {
      throw new Error(
        `Cannot seed demo data because join code ${demoClassConfig.joinCode} already belongs to a different class (${classUsingDemoCode.id}). Remove or rename that class before running the demo seed.`,
      );
    }

    const reusableClass =
      classUsingDemoCode ??
      teacherClasses.find(
        (teacherClass) => teacherClass.name === demoClassConfig.name && !usedClassIds.has(teacherClass.id),
      ) ??
      null;

    const canonicalClass = reusableClass
      ? (
          await db
            .update(classes)
            .set({
              name: demoClassConfig.name,
              joinCode: demoClassConfig.joinCode,
              defaultVariant: demoClassConfig.defaultVariant,
              isArchived: false,
            })
            .where(eq(classes.id, reusableClass.id))
            .returning()
        )[0]
      : (
          await db
            .insert(classes)
            .values({
              teacherId: teacher.id,
              name: demoClassConfig.name,
              joinCode: demoClassConfig.joinCode,
              defaultVariant: demoClassConfig.defaultVariant,
              isArchived: false,
            })
            .returning()
        )[0];

    usedClassIds.add(canonicalClass.id);
    demoClasses.push({
      ...demoClassConfig,
      record: canonicalClass,
    });
  }

  const extraClassIds = teacherClasses
    .filter((teacherClass) => !usedClassIds.has(teacherClass.id))
    .map((teacherClass) => teacherClass.id);

  if (extraClassIds.length > 0) {
    await db
      .delete(classes)
      .where(and(eq(classes.teacherId, teacher.id), inArray(classes.id, extraClassIds)));
  }

  return demoClasses;
}

async function ensureDemoStudents(db, studentProfiles, classId, hashStudentPin, verifyStudentPin) {
  const existingStudents = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.classId, classId),
    orderBy: [asc(studentProfiles.createdAt)],
  });

  const demoStudentNames = new Set(DEMO_STUDENTS.map((student) => student.displayName));
  const rowsToDelete = [];
  const studentsByName = new Map();

  for (const demoStudent of DEMO_STUDENTS) {
    const matches = existingStudents.filter((student) => student.displayName === demoStudent.displayName);
    const keeper = matches[0] ?? null;

    if (matches.length > 1) {
      rowsToDelete.push(...matches.slice(1).map((student) => student.id));
    }

    if (!keeper) {
      const pinHash = await hashStudentPin(demoStudent.pin);
      const [createdStudent] = await db
        .insert(studentProfiles)
        .values({
          classId,
          displayName: demoStudent.displayName,
          pinHash,
          isActive: true,
        })
        .returning();

      studentsByName.set(demoStudent.displayName, createdStudent);
      continue;
    }

    const pinMatches = await verifyStudentPin(demoStudent.pin, keeper.pinHash);

    if (!pinMatches || !keeper.isActive) {
      const pinHash = pinMatches ? keeper.pinHash : await hashStudentPin(demoStudent.pin);
      const [updatedStudent] = await db
        .update(studentProfiles)
        .set({
          displayName: demoStudent.displayName,
          pinHash,
          isActive: true,
        })
        .where(eq(studentProfiles.id, keeper.id))
        .returning();

      studentsByName.set(demoStudent.displayName, updatedStudent);
      continue;
    }

    studentsByName.set(demoStudent.displayName, keeper);
  }

  rowsToDelete.push(
    ...existingStudents
      .filter((student) => !demoStudentNames.has(student.displayName))
      .map((student) => student.id),
  );

  if (rowsToDelete.length > 0) {
    await db
      .delete(studentProfiles)
      .where(and(eq(studentProfiles.classId, classId), inArray(studentProfiles.id, rowsToDelete)));
  }

  return studentsByName;
}

function buildDemoProjectAttempt(buildFreshStudentProjectAttempt, project, attemptId, config) {
  const currentStep = getStepForOffset(project, config.stepOffset);
  const startedAt = hoursAgo(config.startedHoursAgo);
  const lastActiveAt = hoursAgo(config.lastActiveHoursAgo);
  const finishedAt = config.status === "completed" ? hoursAgo(config.finishedHoursAgo) : null;
  const attempt = buildFreshStudentProjectAttempt(project, attemptId, config.variant ?? "control");

  attempt.status = config.status;
  attempt.progressPercent = config.progressPercent;
  attempt.currentStepId = currentStep.id;
  attempt.activeEditorTabId = getStepEditorTabId(currentStep, attempt.activeEditorTabId);
  attempt.startedAt = startedAt.toISOString();
  attempt.lastActiveAt = lastActiveAt.toISOString();
  attempt.finishedAt = finishedAt ? finishedAt.toISOString() : null;
  attempt.stepStartCodeByStep = {
    ...attempt.stepStartCodeByStep,
    [currentStep.id]: attempt.latestCode,
  };

  if (config.reflection) {
    attempt.reflectionResponses[currentStep.id] = config.reflection;
  }

  if (config.status === "completed") {
    attempt.finalCodeSnapshot = attempt.latestCode;
  }

  return attempt;
}

async function ensureDemoAttempts(
  db,
  projectAttempts,
  classId,
  variant,
  studentsByName,
  projects,
  buildFreshStudentProjectAttempt,
  buildProjectAttemptRecordValues,
) {
  if (projects.length === 0) {
    throw new Error("Cannot seed demo attempts because no lesson projects are registered.");
  }

  const firstProject = projects[0];
  const secondProject = projects[1] ?? projects[0];
  const sampleAttemptConfigs = [
    {
      studentName: "Ava Demo",
      project: firstProject,
      status: "in_progress",
      progressPercent: 42,
      stepOffset: 1,
      startedHoursAgo: 30,
      lastActiveHoursAgo: 3,
      finishedHoursAgo: 0,
      reflection: "I changed the title and colors so the page feels more like mine.",
    },
    {
      studentName: "Maya Demo",
      project: secondProject,
      status: "completed",
      progressPercent: 100,
      stepOffset: -1,
      startedHoursAgo: 52,
      lastActiveHoursAgo: 5,
      finishedHoursAgo: 4,
      reflection: "I finished every step and tested the final page before saving it.",
    },
  ];

  const canonicalStudentIds = [...studentsByName.values()].map((student) => student.id);
  const keepAttemptIds = [];

  for (const config of sampleAttemptConfigs) {
    const student = studentsByName.get(config.studentName);

    if (!student) {
      throw new Error(`Missing seeded student "${config.studentName}" while creating demo attempts.`);
    }

    const existingAttempt = await db.query.projectAttempts.findFirst({
      where: and(
        eq(projectAttempts.studentProfileId, student.id),
        eq(projectAttempts.projectSlug, config.project.slug),
        eq(projectAttempts.contentVersion, config.project.contentVersion),
        eq(projectAttempts.variant, variant),
      ),
    });

    const attemptId = existingAttempt?.id ?? crypto.randomUUID();
    const attempt = buildDemoProjectAttempt(
      buildFreshStudentProjectAttempt,
      config.project,
      attemptId,
      { ...config, variant },
    );
    const recordValues = buildProjectAttemptRecordValues({
      attempt,
      classId,
      studentProfileId: student.id,
      project: config.project,
    });

    if (existingAttempt) {
      await db
        .update(projectAttempts)
        .set(recordValues)
        .where(eq(projectAttempts.id, existingAttempt.id));
    } else {
      await db.insert(projectAttempts).values(recordValues);
    }

    keepAttemptIds.push(attemptId);
  }

  await db
    .delete(projectAttempts)
    .where(
      and(
        eq(projectAttempts.classId, classId),
        inArray(projectAttempts.studentProfileId, canonicalStudentIds),
        notInArray(projectAttempts.id, keepAttemptIds),
      ),
    );
}

async function main() {
  const databaseUrl = getRequiredEnv("DATABASE_URL");
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const schema = await import("../lib/db/schema/index.ts");
  const { hashStudentPin, verifyStudentPin } = await import("../lib/security/pins.ts");
  const { getAllProjects } = await import("../lib/projects/index.ts");
  const { buildFreshStudentProjectAttempt, buildProjectAttemptRecordValues } = await import(
    "../lib/student/project-attempt-record.ts"
  );

  const sql = postgres(databaseUrl, {
    prepare: false,
  });
  const db = drizzle({
    client: sql,
    schema,
  });
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const authUser = await ensureDemoAuthUser(supabaseAdmin);
    const teacher = await ensureDemoTeacherRecord(db, schema.teachers, authUser);
    const demoClasses = await ensureDemoClasses(db, schema.classes, teacher);
    const projects = getAllProjects();

    for (const demoClass of demoClasses) {
      const studentsByName = await ensureDemoStudents(
        db,
        schema.studentProfiles,
        demoClass.record.id,
        hashStudentPin,
        verifyStudentPin,
      );

      await ensureDemoAttempts(
        db,
        schema.projectAttempts,
        demoClass.record.id,
        demoClass.defaultVariant,
        studentsByName,
        projects,
        buildFreshStudentProjectAttempt,
        buildProjectAttemptRecordValues,
      );
    }

    console.log("Demo seed complete.");
    console.log("");
    console.log("Teacher demo:");
    console.log(`  Email: ${DEMO_TEACHER_EMAIL}`);
    console.log(`  Password: ${DEMO_TEACHER_PASSWORD}`);
    console.log("");
    console.log("Student demos:");

    for (const demoClass of demoClasses) {
      console.log(`  ${demoClass.name} (${demoClass.defaultVariant}): ${demoClass.joinCode}`);
    }

    console.log("");
    console.log("Student PINs:");

    for (const student of DEMO_STUDENTS) {
      console.log(`  ${student.displayName}: ${student.pin}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
