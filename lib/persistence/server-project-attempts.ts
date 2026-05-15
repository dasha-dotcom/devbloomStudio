import type { LessonProjectConfig } from "@/lib/projects";

import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import type { ProjectAttemptStorage } from "@/lib/persistence/project-attempt-storage";
import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";

type CreateServerProjectAttemptStorageOptions = {
  attemptId: string;
  initialAttempt: ProjectAttempt;
};

export function createServerProjectAttemptStorage({
  attemptId,
  initialAttempt,
}: CreateServerProjectAttemptStorageOptions): ProjectAttemptStorage {
  let cachedAttempt = initialAttempt;

  return {
    async loadAttempt(project: LessonProjectConfig) {
      return normalizeProjectAttempt(project, cachedAttempt);
    },

    async saveAttempt(attempt: ProjectAttempt) {
      const response = await fetch(`/api/student/attempts/${attemptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attempt }),
      });

      if (!response.ok) {
        throw new Error("Failed to save student project attempt.");
      }

      cachedAttempt = attempt;
    },

    async clearAttempt() {
      const response = await fetch(`/api/student/attempts/${attemptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset student project attempt.");
      }

      const payload = (await response.json()) as { attempt?: ProjectAttempt };

      if (payload.attempt) {
        cachedAttempt = payload.attempt;
      }
    },
  };
}
