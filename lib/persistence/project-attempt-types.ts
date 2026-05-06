import type { BuilderSelections } from "@/lib/projects";

export type ProjectAttemptStatus = "in_progress" | "completed";

export type ProjectAttempt = {
  schemaVersion: 1;
  attemptId: string;
  projectSlug: string;
  contentVersion: string;
  status: ProjectAttemptStatus;
  currentStepId: string;
  activeEditorTabId: string;
  progressPercent?: number;
  latestCode: string;
  selectedThemeId: string;
  selectedImageId: string;
  builderSelections: BuilderSelections;
  predictionAnswersByStep: Record<string, number>;
  activityAnswersByStep: Record<string, Record<string, number>>;
  checkpointAnswersByStep: Record<string, Record<string, number>>;
  checkpointSubmittedByStep: Record<string, boolean>;
  reflectionResponses: Record<string, string>;
  builderTouchedByStep: Record<string, Record<string, boolean>>;
  imagePickerTouchedByStep: Record<string, boolean>;
  themePickerTouchedByStep: Record<string, boolean>;
  stepStartCodeByStep: Record<string, string>;
  startedAt: string;
  lastActiveAt: string;
  finishedAt: string | null;
  finalCodeSnapshot?: string;
};
