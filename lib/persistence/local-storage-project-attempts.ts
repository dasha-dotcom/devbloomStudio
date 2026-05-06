import type { LessonProjectConfig } from "@/lib/projects";

import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";
import type { ProjectAttemptStorage } from "@/lib/persistence/project-attempt-storage";

const STORAGE_PREFIX = "devbloom:project-attempt:v1";

export const getProjectAttemptStorageKey = (projectSlug: string, contentVersion: string) =>
  `${STORAGE_PREFIX}:${projectSlug}:${contentVersion}`;

export const localStorageProjectAttemptStorage: ProjectAttemptStorage = {
  async loadAttempt(project: LessonProjectConfig) {
    if (typeof window === "undefined") {
      return null;
    }

    const storageKey = getProjectAttemptStorageKey(project.slug, project.contentVersion);

    try {
      const rawValue = window.localStorage.getItem(storageKey);

      if (!rawValue) {
        return null;
      }

      return normalizeProjectAttempt(project, JSON.parse(rawValue));
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

    const storageKey = getProjectAttemptStorageKey(attempt.projectSlug, attempt.contentVersion);
    window.localStorage.setItem(storageKey, JSON.stringify(attempt));
  },

  async clearAttempt(projectSlug: string, contentVersion: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(getProjectAttemptStorageKey(projectSlug, contentVersion));
  },
};
