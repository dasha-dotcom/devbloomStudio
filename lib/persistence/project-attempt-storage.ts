import type { LessonProjectConfig } from "@/lib/projects";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";

import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";

export type ProjectAttemptStorage = {
  loadAttempt: (project: LessonProjectConfig, variant: LessonVariant) => Promise<ProjectAttempt | null>;
  saveAttempt: (attempt: ProjectAttempt) => Promise<void>;
  clearAttempt: (projectSlug: string, contentVersion: string, variant: LessonVariant) => Promise<void>;
};
