import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { projectAttempts } from "@/lib/db/schema";
import { getProjectBySlug } from "@/lib/projects";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";
import { getCurrentStudentSession } from "@/lib/student/get-current-student-session";
import { buildFreshStudentProjectAttempt, buildProjectAttemptRecordValues } from "@/lib/student/project-attempt-record";

type RouteContext = {
  params: Promise<{
    attemptId: string;
  }>;
};

async function getAuthorizedAttempt(attemptId: string) {
  const session = await getCurrentStudentSession();

  if (!session) {
    return {
      session: null,
      attemptRow: null,
      project: null,
    };
  }

  const db = getDb();
  const attemptRow = await db.query.projectAttempts.findFirst({
    where: and(eq(projectAttempts.id, attemptId), eq(projectAttempts.studentProfileId, session.studentId)),
  });

  if (!attemptRow) {
    return {
      session,
      attemptRow: null,
      project: null,
    };
  }

  const project = getProjectBySlug(attemptRow.projectSlug);

  if (!project || attemptRow.contentVersion !== project.contentVersion) {
    return {
      session,
      attemptRow,
      project: null,
    };
  }

  return {
    session,
    attemptRow,
    project,
  };
}

export async function PUT(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const { session, attemptRow, project } = await getAuthorizedAttempt(attemptId);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!attemptRow || !project) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  let payload: { attempt?: unknown };

  try {
    payload = (await request.json()) as { attempt?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const normalizedAttempt = normalizeProjectAttempt(project, payload.attempt);

  if (!normalizedAttempt) {
    return NextResponse.json({ error: "Invalid attempt payload." }, { status: 400 });
  }

  const nextAttempt: ProjectAttempt = {
    ...normalizedAttempt,
    attemptId: attemptRow.id,
    projectSlug: attemptRow.projectSlug,
    contentVersion: attemptRow.contentVersion,
  };

  await getDb()
    .update(projectAttempts)
    .set(
      buildProjectAttemptRecordValues({
        attempt: nextAttempt,
        classId: session.classId,
        studentProfileId: session.studentId,
        project,
      }),
    )
    .where(eq(projectAttempts.id, attemptRow.id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const { session, attemptRow, project } = await getAuthorizedAttempt(attemptId);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!attemptRow || !project) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  const freshAttempt = buildFreshStudentProjectAttempt(project, attemptRow.id);

  await getDb()
    .update(projectAttempts)
    .set(
      buildProjectAttemptRecordValues({
        attempt: freshAttempt,
        classId: session.classId,
        studentProfileId: session.studentId,
        project,
      }),
    )
    .where(eq(projectAttempts.id, attemptRow.id));

  return NextResponse.json({ ok: true, attempt: freshAttempt });
}
