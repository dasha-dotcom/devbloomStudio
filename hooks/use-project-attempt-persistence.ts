"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearProjectAttempt,
  loadProjectAttempt,
  saveProjectAttempt,
  type ProjectAttempt,
} from "@/lib/persistence/project-attempts";
import type { LessonProjectConfig } from "@/lib/projects";

export type AttemptSaveState = "saving" | "saved" | "error";

type UseProjectAttemptPersistenceOptions = {
  project: LessonProjectConfig;
  autosaveDelayMs?: number;
  onHydrate: (attempt: ProjectAttempt | null) => void;
};

type UseProjectAttemptPersistenceResult = {
  hasHydrated: boolean;
  saveState: AttemptSaveState;
  queueSave: (attempt: ProjectAttempt) => void;
  saveNow: (attempt: ProjectAttempt) => void;
  clearSavedAttempt: () => void;
};

export function useProjectAttemptPersistence({
  project,
  autosaveDelayMs = 700,
  onHydrate,
}: UseProjectAttemptPersistenceOptions): UseProjectAttemptPersistenceResult {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [saveState, setSaveState] = useState<AttemptSaveState>("saved");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const savedAttempt = loadProjectAttempt(project);
    onHydrate(savedAttempt);
    queueMicrotask(() => setHasHydrated(true));

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onHydrate, project]);

  const persistAttempt = useCallback((attempt: ProjectAttempt) => {
    try {
      saveProjectAttempt(attempt);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");

      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to save project attempt.", error);
      }
    }
  }, []);

  const queueSave = useCallback((attempt: ProjectAttempt) => {
    if (!hasHydrated) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setSaveState("saving");
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      persistAttempt(attempt);
    }, autosaveDelayMs);
  }, [autosaveDelayMs, hasHydrated, persistAttempt]);

  const saveNow = useCallback((attempt: ProjectAttempt) => {
    if (!hasHydrated) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSaveState("saving");
    persistAttempt(attempt);
  }, [hasHydrated, persistAttempt]);

  const clearSavedAttempt = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    clearProjectAttempt(project.slug, project.contentVersion);
    setSaveState("saved");
  }, [project.contentVersion, project.slug]);

  return {
    hasHydrated,
    saveState,
    queueSave,
    saveNow,
    clearSavedAttempt,
  };
}
