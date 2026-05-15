"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  localStorageProjectAttemptStorage,
  type ProjectAttemptStorage,
  type ProjectAttempt,
} from "@/lib/persistence/project-attempts";
import type { LessonProjectConfig } from "@/lib/projects";

export type AttemptSaveState = "saving" | "saved" | "error";

type UseProjectAttemptPersistenceOptions = {
  project: LessonProjectConfig;
  storage?: ProjectAttemptStorage;
  autosaveDelayMs?: number;
  onHydrate: (attempt: ProjectAttempt | null) => void;
};

type UseProjectAttemptPersistenceResult = {
  hasHydrated: boolean;
  saveState: AttemptSaveState;
  queueSave: (attempt: ProjectAttempt) => void;
  saveNow: (attempt: ProjectAttempt) => Promise<boolean>;
  clearSavedAttempt: () => void;
};

export function useProjectAttemptPersistence({
  project,
  storage = localStorageProjectAttemptStorage,
  autosaveDelayMs = 700,
  onHydrate,
}: UseProjectAttemptPersistenceOptions): UseProjectAttemptPersistenceResult {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [saveState, setSaveState] = useState<AttemptSaveState>("saved");
  const timeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);
  const loadRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadRequestIdRef.current += 1;
    const requestId = loadRequestIdRef.current;
    let isCancelled = false;

    queueMicrotask(() => {
      if (!isCancelled && isMountedRef.current) {
        setHasHydrated(false);
      }
    });

    void (async () => {
      try {
        const savedAttempt = await storage.loadAttempt(project);

        if (isCancelled || !isMountedRef.current || loadRequestIdRef.current !== requestId) {
          return;
        }

        onHydrate(savedAttempt);
        queueMicrotask(() => {
          if (!isCancelled && isMountedRef.current && loadRequestIdRef.current === requestId) {
            setHasHydrated(true);
          }
        });
      } catch (error) {
        if (isCancelled || !isMountedRef.current || loadRequestIdRef.current !== requestId) {
          return;
        }

        setSaveState("error");
        onHydrate(null);
        queueMicrotask(() => {
          if (!isCancelled && isMountedRef.current && loadRequestIdRef.current === requestId) {
            setHasHydrated(true);
          }
        });

        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to load project attempt.", error);
        }
      }
    })();

    return () => {
      isCancelled = true;

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onHydrate, project, storage]);

  const persistAttempt = useCallback(async (attempt: ProjectAttempt) => {
    try {
      await storage.saveAttempt(attempt);

      if (!isMountedRef.current) {
        return true;
      }

      setSaveState("saved");
      return true;
    } catch (error) {
      if (!isMountedRef.current) {
        return false;
      }

      setSaveState("error");

      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to save project attempt.", error);
      }

      return false;
    }
  }, [storage]);

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
      void persistAttempt(attempt);
    }, autosaveDelayMs);
  }, [autosaveDelayMs, hasHydrated, persistAttempt]);

  const saveNow = useCallback(async (attempt: ProjectAttempt) => {
    if (!hasHydrated) {
      return false;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSaveState("saving");
    return persistAttempt(attempt);
  }, [hasHydrated, persistAttempt]);

  const clearSavedAttempt = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    void (async () => {
      try {
        await storage.clearAttempt(project.slug, project.contentVersion);

        if (!isMountedRef.current) {
          return;
        }

        setSaveState("saved");
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        setSaveState("error");

        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to clear saved project attempt.", error);
        }
      }
    })();
  }, [project.contentVersion, project.slug, storage]);

  return {
    hasHydrated,
    saveState,
    queueSave,
    saveNow,
    clearSavedAttempt,
  };
}
