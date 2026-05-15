import type { LessonProjectConfig } from "@/lib/projects";

import { createFreshProjectAttempt, type ProjectAttempt } from "@/lib/persistence/project-attempts";

type BuildProjectAttemptRecordInput = {
  attempt: ProjectAttempt;
  classId: string;
  studentProfileId: string;
  project: LessonProjectConfig;
};

const toDateOrNow = (value: string | undefined) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toNullableDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function buildFreshStudentProjectAttempt(project: LessonProjectConfig, attemptId: string): ProjectAttempt {
  const freshAttempt = createFreshProjectAttempt(project);

  return {
    ...freshAttempt,
    attemptId,
  };
}

export function getLatestReflectionExcerpt(project: LessonProjectConfig, attempt: ProjectAttempt) {
  const lastReflection = [...project.steps]
    .reverse()
    .map((step) => attempt.reflectionResponses[step.id]?.trim() ?? "")
    .find((value) => value.length > 0);

  if (!lastReflection) {
    return null;
  }

  return lastReflection.slice(0, 280);
}

export function buildProjectAttemptRecordValues({
  attempt,
  classId,
  studentProfileId,
  project,
}: BuildProjectAttemptRecordInput) {
  return {
    id: attempt.attemptId,
    classId,
    studentProfileId,
    projectSlug: attempt.projectSlug,
    contentVersion: attempt.contentVersion,
    status: attempt.status,
    progressPercent: typeof attempt.progressPercent === "number" ? attempt.progressPercent : null,
    currentStepId: attempt.currentStepId,
    lastActiveAt: toDateOrNow(attempt.lastActiveAt),
    finishedAt: toNullableDate(attempt.finishedAt),
    latestReflectionExcerpt: getLatestReflectionExcerpt(project, attempt),
    stateJson: attempt,
  };
}
