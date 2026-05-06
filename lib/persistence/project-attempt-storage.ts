import type { LessonProjectConfig } from "@/lib/projects";

import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";

export type ProjectAttemptStorage = {
  loadAttempt: (project: LessonProjectConfig) => Promise<ProjectAttempt | null>;
  saveAttempt: (attempt: ProjectAttempt) => Promise<void>;
  clearAttempt: (projectSlug: string, contentVersion: string) => Promise<void>;
};
