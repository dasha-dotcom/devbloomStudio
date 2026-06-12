import type { BuilderSelections } from "@/lib/projects";
import type { LessonVariant } from "@/lib/experiments/lesson-variant";
import type {
  ReflectionCoachAiAnalysis,
  ReflectionCoachDetectedSignals,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
  ReflectionCoachSource,
} from "@/lib/reflection-coach/types";

export type ProjectAttemptStatus = "in_progress" | "completed";
export type {
  ReflectionCoachFocus,
  ReflectionCoachResult,
  ReflectionCoachSource,
} from "@/lib/reflection-coach/types";

export type ReflectionCoachCheck = {
  checkedAt: string;
  reflectionText: string;
  coachResult: ReflectionCoachResult;
  coachFollowUpQuestion?: string;
  lessonFocus: ReflectionCoachFocus;
  source?: ReflectionCoachSource;
  detectedSignals?: ReflectionCoachDetectedSignals;
  recommendedFocus?: ReflectionCoachRecommendedFocus;
  analysis?: ReflectionCoachAiAnalysis;
  teacherInsight?: string;
  studentFollowUpAnswer?: string;
  suggestedFinalReflection?: string;
  finalReflection?: string;
};

export type ProjectAttempt = {
  schemaVersion: 1;
  attemptId: string;
  projectSlug: string;
  contentVersion: string;
  variant: LessonVariant;
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
  reflectionCoachChecks: ReflectionCoachCheck[];
  textEntryResponses: Record<string, string>;
  builderTouchedByStep: Record<string, Record<string, boolean>>;
  imagePickerTouchedByStep: Record<string, boolean>;
  themePickerTouchedByStep: Record<string, boolean>;
  stepStartCodeByStep: Record<string, string>;
  startedAt: string;
  lastActiveAt: string;
  finishedAt: string | null;
  finalCodeSnapshot?: string;
};
