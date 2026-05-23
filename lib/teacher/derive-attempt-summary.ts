import { evaluateStepFeedback, hasSubstantiveReflection, type FeedbackState } from "@/lib/lesson-feedback";
import { getStarterCode, type LessonProjectConfig, type LessonStep } from "@/lib/projects";
import type { ProjectAttempt } from "@/lib/persistence/project-attempt-types";

type BinaryStatus = "not_applicable" | "pending" | "complete";

export type TeacherAttemptPredictionStatus = "not_applicable" | "pending" | "answered";
export type TeacherAttemptCheckpointStatus = "not_applicable" | "pending" | "close" | "pass";
export type TeacherAttemptReflectionStatus = BinaryStatus;

export type TeacherAttemptStepSummary = {
  stepId: string;
  stepTitle: string;
  shortTitle: string;
  stepOrder: number;
  countsTowardProgress: boolean;
  isCurrent: boolean;
  isVisited: boolean;
  isCompleted: boolean;
  feedbackState: FeedbackState;
  canGoNext: boolean;
  predictionStatus: TeacherAttemptPredictionStatus;
  checkpointStatus: TeacherAttemptCheckpointStatus;
  checkpointSubmitted: boolean;
  reflectionStatus: TeacherAttemptReflectionStatus;
  activityStatus: BinaryStatus;
  builderStatus: BinaryStatus;
  imagePickerStatus: BinaryStatus;
  themePickerStatus: BinaryStatus;
  codeEditStatus: BinaryStatus;
};

export type TeacherAttemptFrictionPoint = {
  stepId: string;
  stepTitle: string;
  kind: "blocked" | "in_progress";
  summary: string;
  detail: string;
};

export type TeacherAttemptDerivedSummary = {
  startedAt: Date | null;
  lastActiveAt: Date | null;
  finishedAt: Date | null;
  approximateDurationMs: number | null;
  currentStepId: string;
  currentStepTitle: string;
  progressPercent: number;
  completedProgressSteps: number;
  totalProgressSteps: number;
  visitedStepIds: string[];
  completedStepIds: string[];
  steps: TeacherAttemptStepSummary[];
  currentStep: TeacherAttemptStepSummary | null;
  predictionSummary: {
    answeredCount: number;
    totalCount: number;
    pendingCount: number;
  };
  checkpointSummary: {
    passedCount: number;
    totalCount: number;
    pendingCount: number;
  };
  reflectionSummary: {
    completedCount: number;
    totalCount: number;
    pendingCount: number;
  };
  likelyFrictionPoint: TeacherAttemptFrictionPoint | null;
};

const normalizeForCompare = (value: string) => value.replace(/\s+/g, " ").trim();

const hasAnyCodeChange = (currentCode: string, previousCode: string) =>
  normalizeForCompare(currentCode) !== normalizeForCompare(previousCode);

const getStepEditorTabId = (step: LessonStep) => step.defaultEditorTabId ?? step.editorTabs?.[0]?.id ?? "default";

const toDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const deriveLikelyFrictionPoint = (
  currentStep: TeacherAttemptStepSummary | null,
  attempt: ProjectAttempt,
): TeacherAttemptFrictionPoint | null => {
  if (!currentStep || attempt.status === "completed") {
    return null;
  }

  if (currentStep.checkpointStatus === "close") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "blocked",
      summary: "Checkpoint is close but not passing yet.",
      detail: "The current checkpoint was submitted, but the saved answers are still short of a pass.",
    };
  }

  if (currentStep.checkpointStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: currentStep.canGoNext ? "in_progress" : "blocked",
      summary: currentStep.checkpointSubmitted ? "Checkpoint is not passing yet." : "Checkpoint is still pending.",
      detail: currentStep.checkpointSubmitted
        ? "The saved checkpoint answers do not pass yet."
        : "The student has not finished or submitted the checkpoint on this step yet.",
    };
  }

  if (currentStep.reflectionStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: currentStep.canGoNext ? "in_progress" : "blocked",
      summary: "Reflection response is still pending.",
      detail: "This step expects a substantive reflection, and the saved response is still missing or too short.",
    };
  }

  if (currentStep.predictionStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Prediction prompt has not been answered yet.",
      detail: "The student appears to still be on the prediction part of this step.",
    };
  }

  if (currentStep.activityStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Step activity is still incomplete.",
      detail: "The saved answers suggest the student has not finished this step's activity questions yet.",
    };
  }

  if (currentStep.builderStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Builder choices are still incomplete.",
      detail: "The student has not touched all of the builder choices used by this step yet.",
    };
  }

  if (currentStep.imagePickerStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Image choice is still pending.",
      detail: "The saved state suggests the student has not selected the required image on this step yet.",
    };
  }

  if (currentStep.themePickerStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Theme choice is still pending.",
      detail: "The saved state suggests the student has not selected the required theme on this step yet.",
    };
  }

  if (currentStep.codeEditStatus === "pending") {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: "in_progress",
      summary: "Code edit on this step is still pending.",
      detail: "The current code still looks unchanged from the start of this step.",
    };
  }

  if (!currentStep.isCompleted) {
    return {
      stepId: currentStep.stepId,
      stepTitle: currentStep.stepTitle,
      kind: currentStep.canGoNext ? "in_progress" : "blocked",
      summary: "Student appears to still be working on the current step.",
      detail: "The saved attempt is still on this step, and its tracked requirements are not all complete yet.",
    };
  }

  return null;
};

export function deriveTeacherAttemptSummary(
  project: LessonProjectConfig,
  attempt: ProjectAttempt,
): TeacherAttemptDerivedSummary {
  const firstStepId = project.steps[0]?.id ?? attempt.currentStepId;
  const visitedStepIdSet = new Set<string>([firstStepId, attempt.currentStepId]);

  for (const stepId of Object.keys(attempt.stepStartCodeByStep)) {
    if (project.steps.some((step) => step.id === stepId)) {
      visitedStepIdSet.add(stepId);
    }
  }

  const stepSummaries = project.steps.map((projectStep) => {
    const rendersActivity = Boolean(projectStep.activity && !(projectStep.feedbackMode === "checkpoint" && projectStep.checkpoint));
    const activityQuestionCount = projectStep.activity?.questions.length ?? 0;
    const currentStarterCode = getStarterCode(project, projectStep, attempt.builderSelections);
    const currentStepStartCode = attempt.stepStartCodeByStep[projectStep.id];
    const effectiveStepStartCode = currentStepStartCode ?? currentStarterCode;
    const editorTabId = getStepEditorTabId(projectStep);
    const requiresFeedbackCheck = projectStep.feedbackMode && projectStep.feedbackMode !== "none";
    const currentEditorCode =
      project.getEditorCodeSlice?.({
        code: attempt.latestCode,
        step: projectStep,
        editorTabId,
      }) ??
      project.transformStepCode?.({ code: attempt.latestCode, step: projectStep, surface: "editor" }) ??
      attempt.latestCode;
    const currentStarterEditorCode =
      project.getEditorCodeSlice?.({
        code: currentStarterCode,
        step: projectStep,
        editorTabId,
      }) ??
      project.transformStepCode?.({ code: currentStarterCode, step: projectStep, surface: "editor" }) ??
      currentStarterCode;
    const currentStepStartEditorCode =
      project.getEditorCodeSlice?.({
        code: effectiveStepStartCode,
        step: projectStep,
        editorTabId,
      }) ??
      project.transformStepCode?.({ code: effectiveStepStartCode, step: projectStep, surface: "editor" }) ??
      effectiveStepStartCode;
    const stepFeedback = evaluateStepFeedback({
      step: projectStep,
      code: attempt.latestCode,
      starterCode: currentStarterCode,
      stepStartCode: effectiveStepStartCode,
      editorCode: currentEditorCode,
      starterEditorCode: currentStarterEditorCode,
      stepStartEditorCode: currentStepStartEditorCode,
      autoCheckRequested: false,
      checkpointAnswers: attempt.checkpointAnswersByStep[projectStep.id] ?? {},
      checkpointSubmitted: Boolean(attempt.checkpointSubmittedByStep[projectStep.id]),
      reflectionResponse: attempt.reflectionResponses[projectStep.id] ?? "",
    });

    const predictionStatus: TeacherAttemptPredictionStatus = !projectStep.prediction
      ? "not_applicable"
      : attempt.predictionAnswersByStep[projectStep.id] !== undefined
        ? "answered"
        : "pending";
    const checkpointSubmitted = Boolean(attempt.checkpointSubmittedByStep[projectStep.id]);
    const checkpointStatus: TeacherAttemptCheckpointStatus =
      projectStep.feedbackMode !== "checkpoint" || !projectStep.checkpoint
        ? "not_applicable"
        : stepFeedback.state === "pass"
          ? "pass"
          : stepFeedback.state === "close"
            ? "close"
            : "pending";
    const reflectionStatus: TeacherAttemptReflectionStatus =
      projectStep.feedbackMode !== "reflection"
        ? "not_applicable"
        : hasSubstantiveReflection(attempt.reflectionResponses[projectStep.id] ?? "")
          ? "complete"
          : "pending";
    const activityStatus: BinaryStatus =
      !rendersActivity
        ? "not_applicable"
        : Object.keys(attempt.activityAnswersByStep[projectStep.id] ?? {}).length === activityQuestionCount
          ? "complete"
          : "pending";
    const builderStatus: BinaryStatus =
      !projectStep.showBuilder
        ? "not_applicable"
        : (project.builder?.questions.every((question) => attempt.builderTouchedByStep[projectStep.id]?.[question.id]) ??
            false)
          ? "complete"
          : "pending";
    const imagePickerStatus: BinaryStatus =
      !projectStep.showImagePicker
        ? "not_applicable"
        : attempt.imagePickerTouchedByStep[projectStep.id]
          ? "complete"
          : "pending";
    const themePickerStatus: BinaryStatus =
      !projectStep.showThemePicker
        ? "not_applicable"
        : attempt.themePickerTouchedByStep[projectStep.id]
          ? "complete"
          : "pending";
    const needsCodeEditCheck =
      projectStep.showEditor &&
      !projectStep.showImagePicker &&
      !projectStep.showThemePicker &&
      !projectStep.showBuilder &&
      !requiresFeedbackCheck;
    const codeEditStatus: BinaryStatus =
      !needsCodeEditCheck
        ? "not_applicable"
        : hasAnyCodeChange(currentEditorCode, currentStepStartEditorCode)
          ? "complete"
          : "pending";
    const hasTrackedRequirement =
      requiresFeedbackCheck ||
      Boolean(projectStep.prediction) ||
      rendersActivity ||
      Boolean(projectStep.showBuilder) ||
      Boolean(projectStep.showImagePicker) ||
      Boolean(projectStep.showThemePicker) ||
      needsCodeEditCheck;
    const isReadOnlyIntroStep =
      projectStep.countsTowardProgress === false &&
      !projectStep.showEditor &&
      !projectStep.showBuilder &&
      !projectStep.showImagePicker &&
      !projectStep.showThemePicker &&
      !projectStep.prediction &&
      !projectStep.activity &&
      (!projectStep.feedbackMode || projectStep.feedbackMode === "none");
    const stepIndex = project.steps.findIndex((step) => step.id === projectStep.id);
    const feedbackDone = !requiresFeedbackCheck || stepFeedback.state === "pass";
    const predictionDone = predictionStatus === "not_applicable" || predictionStatus === "answered";
    const activityDone = activityStatus === "not_applicable" || activityStatus === "complete";
    const builderDone = builderStatus === "not_applicable" || builderStatus === "complete";
    const imagePickerDone = imagePickerStatus === "not_applicable" || imagePickerStatus === "complete";
    const themePickerDone = themePickerStatus === "not_applicable" || themePickerStatus === "complete";
    const codeEditDone = codeEditStatus === "not_applicable" || codeEditStatus === "complete";

    let isCompleted = false;

    if (isReadOnlyIntroStep) {
      const currentStepIndex = project.steps.findIndex((step) => step.id === attempt.currentStepId);
      isCompleted = currentStepIndex > stepIndex;
    } else if (hasTrackedRequirement) {
      isCompleted =
        feedbackDone &&
        predictionDone &&
        activityDone &&
        builderDone &&
        imagePickerDone &&
        themePickerDone &&
        codeEditDone;
    }

    return {
      stepId: projectStep.id,
      stepTitle: projectStep.title,
      shortTitle: projectStep.shortTitle,
      stepOrder: projectStep.order,
      countsTowardProgress: projectStep.countsTowardProgress !== false,
      isCurrent: projectStep.id === attempt.currentStepId,
      isVisited: visitedStepIdSet.has(projectStep.id),
      isCompleted,
      feedbackState: stepFeedback.state,
      canGoNext: stepFeedback.canGoNext,
      predictionStatus,
      checkpointStatus,
      checkpointSubmitted,
      reflectionStatus,
      activityStatus,
      builderStatus,
      imagePickerStatus,
      themePickerStatus,
      codeEditStatus,
    } satisfies TeacherAttemptStepSummary;
  });

  const visitedStepIds = stepSummaries.filter((step) => step.isVisited).map((step) => step.stepId);
  const completedStepIds = stepSummaries.filter((step) => step.isCompleted).map((step) => step.stepId);
  const completedProgressSteps = stepSummaries.filter((step) => step.countsTowardProgress && step.isCompleted).length;
  const totalProgressSteps = stepSummaries.filter((step) => step.countsTowardProgress).length;
  const derivedProgressPercent = Math.round((completedProgressSteps / Math.max(totalProgressSteps, 1)) * 100);
  const currentStep = stepSummaries.find((step) => step.isCurrent) ?? null;
  const currentStepTitle = currentStep?.stepTitle ?? attempt.currentStepId;
  const startedAt = toDate(attempt.startedAt);
  const lastActiveAt = toDate(attempt.lastActiveAt);
  const finishedAt = toDate(attempt.finishedAt);
  const endedAt = finishedAt ?? lastActiveAt;
  const approximateDurationMs =
    startedAt && endedAt && endedAt.getTime() >= startedAt.getTime()
      ? endedAt.getTime() - startedAt.getTime()
      : null;
  const predictionSteps = stepSummaries.filter((step) => step.predictionStatus !== "not_applicable");
  const checkpointSteps = stepSummaries.filter((step) => step.checkpointStatus !== "not_applicable");
  const reflectionSteps = stepSummaries.filter((step) => step.reflectionStatus !== "not_applicable");

  return {
    startedAt,
    lastActiveAt,
    finishedAt,
    approximateDurationMs,
    currentStepId: attempt.currentStepId,
    currentStepTitle,
    progressPercent: typeof attempt.progressPercent === "number" ? attempt.progressPercent : derivedProgressPercent,
    completedProgressSteps,
    totalProgressSteps,
    visitedStepIds,
    completedStepIds,
    steps: stepSummaries,
    currentStep,
    predictionSummary: {
      answeredCount: predictionSteps.filter((step) => step.predictionStatus === "answered").length,
      totalCount: predictionSteps.length,
      pendingCount: predictionSteps.filter((step) => step.predictionStatus === "pending").length,
    },
    checkpointSummary: {
      passedCount: checkpointSteps.filter((step) => step.checkpointStatus === "pass").length,
      totalCount: checkpointSteps.length,
      pendingCount: checkpointSteps.filter((step) => step.checkpointStatus !== "pass").length,
    },
    reflectionSummary: {
      completedCount: reflectionSteps.filter((step) => step.reflectionStatus === "complete").length,
      totalCount: reflectionSteps.length,
      pendingCount: reflectionSteps.filter((step) => step.reflectionStatus === "pending").length,
    },
    likelyFrictionPoint: deriveLikelyFrictionPoint(currentStep, attempt),
  };
}
