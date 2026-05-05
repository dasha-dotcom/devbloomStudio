import type { BuilderSelections, LessonProjectConfig } from "@/lib/projects";
import { getDefaultBuilderSelections, getStarterCode, getStarterImageId } from "@/lib/projects";

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

const STORAGE_PREFIX = "devbloom:project-attempt:v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((item) => typeof item === "string");

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every((item) => typeof item === "number");

const isBooleanRecord = (value: unknown): value is Record<string, boolean> =>
  isRecord(value) && Object.values(value).every((item) => typeof item === "boolean");

const getDefaultStepId = (project: LessonProjectConfig) => project.steps[0]?.id ?? "default";

export const getDefaultEditorTabId = (project: LessonProjectConfig, stepId?: string) => {
  const step = project.steps.find((item) => item.id === stepId) ?? project.steps[0];
  return step?.defaultEditorTabId ?? step?.editorTabs?.[0]?.id ?? "default";
};

export const getProjectAttemptStorageKey = (projectSlug: string, contentVersion: string) =>
  `${STORAGE_PREFIX}:${projectSlug}:${contentVersion}`;

export const resolveSavedStepId = (
  project: LessonProjectConfig,
  currentStepId: string | undefined,
  fallback: "first" | "last" = "first",
) => {
  if (currentStepId && project.steps.some((step) => step.id === currentStepId)) {
    return currentStepId;
  }

  if (fallback === "last") {
    return project.steps.at(-1)?.id ?? getDefaultStepId(project);
  }

  return getDefaultStepId(project);
};

const sanitizeBuilderSelections = (project: LessonProjectConfig, value: unknown): BuilderSelections => {
  const defaults = getDefaultBuilderSelections(project);

  if (!isStringRecord(value) || !project.builder) {
    return defaults;
  }

  const questionIds = new Set(project.builder.questions.map((question) => question.id));
  const sanitizedEntries = Object.entries(value).filter(([questionId]) => questionIds.has(questionId));

  return {
    ...defaults,
    ...Object.fromEntries(sanitizedEntries),
  };
};

const sanitizeStepCodeByStep = (
  project: LessonProjectConfig,
  builderSelections: BuilderSelections,
  value: unknown,
) => {
  const firstStep = project.steps[0];
  const firstStepCode = getStarterCode(project, firstStep, builderSelections);

  if (!isStringRecord(value)) {
    return { [firstStep.id]: firstStepCode };
  }

  const stepIds = new Set(project.steps.map((step) => step.id));
  const sanitizedEntries = Object.entries(value).filter(
    ([stepId, code]) => stepIds.has(stepId) && typeof code === "string",
  );
  const nextValue = Object.fromEntries(sanitizedEntries);

  if (!nextValue[firstStep.id]) {
    nextValue[firstStep.id] = firstStepCode;
  }

  return nextValue;
};

const sanitizeNestedEntries = <T extends Record<string, unknown>>(
  project: LessonProjectConfig,
  value: unknown,
  guard: (item: unknown) => item is T,
) => {
  if (!isRecord(value)) {
    return {};
  }

  const stepIds = new Set(project.steps.map((step) => step.id));

  return Object.fromEntries(
    Object.entries(value).filter(([stepId, item]) => stepIds.has(stepId) && guard(item)),
  ) as Record<string, T>;
};

const sanitizeFlatBooleanByStep = (project: LessonProjectConfig, value: unknown) => {
  if (!isBooleanRecord(value)) {
    return {};
  }

  const stepIds = new Set(project.steps.map((step) => step.id));
  return Object.fromEntries(Object.entries(value).filter(([stepId]) => stepIds.has(stepId)));
};

const sanitizeFlatStringByStep = (project: LessonProjectConfig, value: unknown) => {
  if (!isStringRecord(value)) {
    return {};
  }

  const stepIds = new Set(project.steps.map((step) => step.id));
  return Object.fromEntries(Object.entries(value).filter(([stepId]) => stepIds.has(stepId)));
};

const sanitizeActiveEditorTabId = (
  project: LessonProjectConfig,
  currentStepId: string,
  value: unknown,
) => {
  const step = project.steps.find((item) => item.id === currentStepId) ?? project.steps[0];
  const stepTabIds = new Set(step?.editorTabs?.map((item) => item.id) ?? [getDefaultEditorTabId(project, step?.id)]);

  if (typeof value === "string" && stepTabIds.has(value)) {
    return value;
  }

  return getDefaultEditorTabId(project, step?.id);
};

const sanitizeThemeId = (project: LessonProjectConfig, value: unknown) => {
  if (typeof value !== "string") {
    return project.defaultThemeId ?? "";
  }

  if (!project.themeOptions?.length) {
    return value;
  }

  return project.themeOptions.some((option) => option.id === value) ? value : project.defaultThemeId ?? "";
};

const sanitizeImageId = (project: LessonProjectConfig, latestCode: string, value: unknown) => {
  const fallback = getStarterImageId(project, latestCode);

  if (typeof value !== "string") {
    return fallback;
  }

  if (!project.imageOptions?.length) {
    return value;
  }

  return project.imageOptions.some((option) => option.id === value) ? value : fallback;
};

export const createFreshProjectAttempt = (project: LessonProjectConfig): ProjectAttempt => {
  const builderSelections = getDefaultBuilderSelections(project);
  const firstStep = project.steps[0];
  const latestCode = getStarterCode(project, firstStep, builderSelections);
  const now = new Date().toISOString();

  return {
    schemaVersion: 1,
    attemptId: crypto.randomUUID(),
    projectSlug: project.slug,
    contentVersion: project.contentVersion,
    status: "in_progress",
    currentStepId: firstStep.id,
    activeEditorTabId: getDefaultEditorTabId(project, firstStep.id),
    progressPercent: 0,
    latestCode,
    selectedThemeId: project.defaultThemeId ?? "",
    selectedImageId: getStarterImageId(project, latestCode),
    builderSelections,
    predictionAnswersByStep: {},
    activityAnswersByStep: {},
    checkpointAnswersByStep: {},
    checkpointSubmittedByStep: {},
    reflectionResponses: {},
    builderTouchedByStep: {},
    imagePickerTouchedByStep: {},
    themePickerTouchedByStep: {},
    stepStartCodeByStep: {
      [firstStep.id]: latestCode,
    },
    startedAt: now,
    lastActiveAt: now,
    finishedAt: null,
  };
};

export const sanitizeProjectAttempt = (
  project: LessonProjectConfig,
  rawValue: unknown,
): ProjectAttempt | null => {
  if (!isRecord(rawValue)) {
    return null;
  }

  const schemaVersion = rawValue.schemaVersion;
  const projectSlug = rawValue.projectSlug;
  const contentVersion = rawValue.contentVersion;

  if (schemaVersion !== 1 || projectSlug !== project.slug || contentVersion !== project.contentVersion) {
    return null;
  }

  const builderSelections = sanitizeBuilderSelections(project, rawValue.builderSelections);
  const firstStep = project.steps[0];
  const starterCode = getStarterCode(project, firstStep, builderSelections);
  const latestCode = typeof rawValue.latestCode === "string" ? rawValue.latestCode : starterCode;
  const currentStepId = resolveSavedStepId(
    project,
    typeof rawValue.currentStepId === "string" ? rawValue.currentStepId : undefined,
  );
  const status = rawValue.status === "completed" ? "completed" : "in_progress";

  return {
    schemaVersion: 1,
    attemptId: typeof rawValue.attemptId === "string" ? rawValue.attemptId : crypto.randomUUID(),
    projectSlug: project.slug,
    contentVersion: project.contentVersion,
    status,
    currentStepId,
    activeEditorTabId: sanitizeActiveEditorTabId(project, currentStepId, rawValue.activeEditorTabId),
    progressPercent: typeof rawValue.progressPercent === "number" ? rawValue.progressPercent : undefined,
    latestCode,
    selectedThemeId: sanitizeThemeId(project, rawValue.selectedThemeId),
    selectedImageId: sanitizeImageId(project, latestCode, rawValue.selectedImageId),
    builderSelections,
    predictionAnswersByStep: sanitizeFlatNumberByStep(project, rawValue.predictionAnswersByStep),
    activityAnswersByStep: sanitizeNestedEntries(
      project,
      rawValue.activityAnswersByStep,
      (item): item is Record<string, number> => isNumberRecord(item),
    ),
    checkpointAnswersByStep: sanitizeNestedEntries(
      project,
      rawValue.checkpointAnswersByStep,
      (item): item is Record<string, number> => isNumberRecord(item),
    ),
    checkpointSubmittedByStep: sanitizeFlatBooleanByStep(project, rawValue.checkpointSubmittedByStep),
    reflectionResponses: sanitizeFlatStringByStep(project, rawValue.reflectionResponses),
    builderTouchedByStep: sanitizeNestedEntries(
      project,
      rawValue.builderTouchedByStep,
      (item): item is Record<string, boolean> => isBooleanRecord(item),
    ),
    imagePickerTouchedByStep: sanitizeFlatBooleanByStep(project, rawValue.imagePickerTouchedByStep),
    themePickerTouchedByStep: sanitizeFlatBooleanByStep(project, rawValue.themePickerTouchedByStep),
    stepStartCodeByStep: sanitizeStepCodeByStep(project, builderSelections, rawValue.stepStartCodeByStep),
    startedAt: typeof rawValue.startedAt === "string" ? rawValue.startedAt : new Date().toISOString(),
    lastActiveAt: typeof rawValue.lastActiveAt === "string" ? rawValue.lastActiveAt : new Date().toISOString(),
    finishedAt:
      status === "completed" && typeof rawValue.finishedAt === "string" ? rawValue.finishedAt : null,
    finalCodeSnapshot:
      status === "completed" && typeof rawValue.finalCodeSnapshot === "string"
        ? rawValue.finalCodeSnapshot
        : undefined,
  };
};

const sanitizeFlatNumberByStep = (project: LessonProjectConfig, value: unknown) => {
  if (!isNumberRecord(value)) {
    return {};
  }

  const stepIds = new Set(project.steps.map((step) => step.id));
  return Object.fromEntries(Object.entries(value).filter(([stepId]) => stepIds.has(stepId)));
};

export const loadProjectAttempt = (project: LessonProjectConfig): ProjectAttempt | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getProjectAttemptStorageKey(project.slug, project.contentVersion);

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    return sanitizeProjectAttempt(project, JSON.parse(rawValue));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load saved project attempt.", error);
    }

    return null;
  }
};

export const saveProjectAttempt = (attempt: ProjectAttempt) => {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getProjectAttemptStorageKey(attempt.projectSlug, attempt.contentVersion);
  window.localStorage.setItem(storageKey, JSON.stringify(attempt));
};

export const clearProjectAttempt = (projectSlug: string, contentVersion: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(getProjectAttemptStorageKey(projectSlug, contentVersion));
};
