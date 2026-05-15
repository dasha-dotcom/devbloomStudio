"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";

import type { AppShellNavMode } from "@/components/app-shell";
import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { createServerProjectAttemptStorage, type ProjectAttempt } from "@/lib/persistence/project-attempts";
import { getProjectBySlug } from "@/lib/projects";

type ProjectLessonPageProps = {
  slug: string;
  projectsHref?: string;
  autosaveDelayMs?: number;
  navMode?: AppShellNavMode;
  serverAttempt?: {
    attemptId: string;
    initialAttempt: ProjectAttempt;
  };
};

export function ProjectLessonPage({
  slug,
  projectsHref,
  autosaveDelayMs,
  navMode,
  serverAttempt,
}: ProjectLessonPageProps) {
  const [stableServerAttempt] = useState(serverAttempt);
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const storage = useMemo(
    () =>
      stableServerAttempt
        ? createServerProjectAttemptStorage({
            attemptId: stableServerAttempt.attemptId,
            initialAttempt: stableServerAttempt.initialAttempt,
          })
        : undefined,
    [stableServerAttempt],
  );

  return (
    <LessonPageShell
      project={project}
      storage={storage}
      autosaveDelayMs={autosaveDelayMs}
      projectsHref={projectsHref}
      navMode={navMode}
    />
  );
}
