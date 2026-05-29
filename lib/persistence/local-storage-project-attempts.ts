import type { LessonProjectConfig } from "@/lib/projects";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";

import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";
import type { ProjectAttemptStorage } from "@/lib/persistence/project-attempt-storage";

const STORAGE_PREFIX = "devbloom:project-attempt:v1";
const LEGACY_STORAGE_PREFIX = "devbloom:project-attempt:v1";

export const getProjectAttemptStorageKey = (
  projectSlug: string,
  contentVersion: string,
  variant: LessonVariant,
) => `${STORAGE_PREFIX}:${variant}:${projectSlug}:${contentVersion}`;

const getLegacyProjectAttemptStorageKey = (projectSlug: string, contentVersion: string) =>
  `${LEGACY_STORAGE_PREFIX}:${projectSlug}:${contentVersion}`;

export const localStorageProjectAttemptStorage: ProjectAttemptStorage = {
  async loadAttempt(project: LessonProjectConfig, variant: LessonVariant) {
    if (typeof window === "undefined") {
      return null;
    }

    const storageKey = getProjectAttemptStorageKey(project.slug, project.contentVersion, variant);

    try {
      const rawValue = window.localStorage.getItem(storageKey);

      if (rawValue !== null) {
        return normalizeProjectAttempt(project, JSON.parse(rawValue));
      }

      if (variant !== "control") {
        return null;
      }

      const legacyRawValue = window.localStorage.getItem(
        getLegacyProjectAttemptStorageKey(project.slug, project.contentVersion),
      );

      if (!legacyRawValue) {
        return null;
      }

      return normalizeProjectAttempt(project, JSON.parse(legacyRawValue));
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to load saved project attempt.", error);
      }

      return null;
    }
  },

  async saveAttempt(attempt: ProjectAttempt) {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getProjectAttemptStorageKey(
      attempt.projectSlug,
      attempt.contentVersion,
      attempt.variant,
    );
    window.localStorage.setItem(storageKey, JSON.stringify(attempt));
  },

  async clearAttempt(projectSlug: string, contentVersion: string, variant: LessonVariant) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getProjectAttemptStorageKey(projectSlug, contentVersion, variant),
      "null",
    );
  },
};
