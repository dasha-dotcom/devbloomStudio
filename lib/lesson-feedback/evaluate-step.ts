import type { LessonSuccessCriteria, LessonStep, LessonTargetRegion } from "@/lib/projects";

import type { CheckpointAnswers, FeedbackState, StepFeedbackContext, StepFeedbackResult } from "@/lib/lesson-feedback/types";

const defaultPassMessage = "Nice — that changed the right part of the page.";
const defaultCloseMessage = "You're close. This step is asking about the part you just edited.";
const defaultNotYetMessage = "Something still needs attention here. Check which line controls this part.";

const extractRegion = (code: string, region: LessonTargetRegion) => {
  const startIndex = code.indexOf(region.startAfter);

  if (startIndex === -1) {
    return null;
  }

  const contentStart = startIndex + region.startAfter.length;
  const endIndex = code.indexOf(region.endBefore, contentStart);

  if (endIndex === -1 || endIndex < contentStart) {
    return null;
  }

  return code.slice(contentStart, endIndex);
};

const normalizeForCompare = (value: string) => value.replace(/\s+/g, " ").trim();

export const hasSubstantiveReflection = (value: string) => {
  const nonSpaceCharacterCount = value.replace(/\s/g, "").length;
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  return nonSpaceCharacterCount >= 8 || wordCount >= 2;
};

const evaluateCriteria = (
  criteria: LessonSuccessCriteria,
  currentCode: string,
  starterCode: string,
  stepStartCode: string,
): boolean => {
  if (criteria.type === "changedFromStarter") {
    return normalizeForCompare(currentCode) !== normalizeForCompare(starterCode);
  }

  if (criteria.type === "changedFromStepStart") {
    return normalizeForCompare(currentCode) !== normalizeForCompare(stepStartCode);
  }

  if (criteria.type === "changedInTargetRegion") {
    const currentRegion = extractRegion(currentCode, criteria.region);
    const starterRegion = extractRegion(starterCode, criteria.region);

    if (currentRegion === null || starterRegion === null) {
      return false;
    }

    return normalizeForCompare(currentRegion) !== normalizeForCompare(starterRegion);
  }

  if (criteria.type === "codeIncludes") {
    return currentCode.includes(criteria.value);
  }

  if (criteria.type === "codeIncludesAny") {
    return criteria.values.some((value) => currentCode.includes(value));
  }

  if (criteria.type === "codeExcludes") {
    return !currentCode.includes(criteria.value);
  }

  if (criteria.type === "allOf") {
    return criteria.criteria.every((item) => evaluateCriteria(item, currentCode, starterCode, stepStartCode));
  }

  return criteria.criteria.some((item) => evaluateCriteria(item, currentCode, starterCode, stepStartCode));
};

const getEvaluationMessage = (step: LessonStep, state: FeedbackState) => {
  if (state === "pass") {
    return step.passMessage ?? defaultPassMessage;
  }

  if (state === "close") {
    return step.closeMessage ?? defaultCloseMessage;
  }

  return step.notYetMessage ?? defaultNotYetMessage;
};

const getCheckpointState = (step: LessonStep, answers: CheckpointAnswers, submitted: boolean): FeedbackState => {
  const questions = step.checkpoint?.questions ?? [];

  if (!submitted) {
    return "notYet";
  }

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;

  if (answeredCount < questions.length) {
    return "notYet";
  }

  const correctCount = questions.filter(
    (question) => answers[question.id] === question.correctOptionIndex,
  ).length;

  if (correctCount === questions.length) {
    return "pass";
  }

  return correctCount > 0 ? "close" : "notYet";
};

export function evaluateStepFeedback({
  step,
  code,
  starterCode,
  stepStartCode,
  editorCode,
  starterEditorCode,
  stepStartEditorCode,
  autoCheckRequested,
  checkpointAnswers,
  checkpointSubmitted,
  reflectionResponse,
}: StepFeedbackContext): StepFeedbackResult {
  const feedbackMode = step.feedbackMode ?? "none";
  const allowNextWhen = step.allowNextWhen ?? (step.isGate ? "pass" : "always");
  const needsManualCheck = feedbackMode === "autoCheck" && step.checkBehavior === "manual";

  if (feedbackMode === "none") {
    return {
      state: "pass",
      message: "",
      canGoNext: true,
      needsManualCheck: false,
      isPending: false,
      allowNextWhen,
    };
  }

  if (feedbackMode === "reflection") {
    const hasResponse = hasSubstantiveReflection(reflectionResponse);
    const canGoNext = allowNextWhen === "answered" ? hasResponse : true;

    return {
      state: hasResponse ? "pass" : "notYet",
      message: hasResponse
        ? step.passMessage ?? "Nice reflection. You noticed what this project was teaching."
        : step.notYetMessage ?? "Take a moment to name what you noticed in your own words.",
      canGoNext,
      needsManualCheck: false,
      isPending: false,
      allowNextWhen,
    };
  }

  if (feedbackMode === "checkpoint") {
    const state = getCheckpointState(step, checkpointAnswers, checkpointSubmitted);

    return {
      state,
      message: getEvaluationMessage(step, state),
      canGoNext: allowNextWhen === "pass" ? state === "pass" : checkpointSubmitted,
      needsManualCheck: false,
      isPending: !checkpointSubmitted,
      allowNextWhen,
    };
  }

  if (!step.successCriteria) {
    return {
      state: "notYet",
      message: getEvaluationMessage(step, "notYet"),
      canGoNext: !step.isGate,
      needsManualCheck,
      isPending: needsManualCheck,
      allowNextWhen,
    };
  }

  const targetCode = step.editorTabs?.length ? editorCode : code;
  const targetStarterCode = step.editorTabs?.length ? starterEditorCode : starterCode;
  const targetStepStartCode = step.editorTabs?.length ? stepStartEditorCode : stepStartCode;
  const didPass = evaluateCriteria(step.successCriteria, targetCode, targetStarterCode, targetStepStartCode);
  const hasChecked = !needsManualCheck || autoCheckRequested;
  const state: FeedbackState = hasChecked ? (didPass ? "pass" : "notYet") : "notYet";
  const message = hasChecked
    ? getEvaluationMessage(step, state)
    : "Make your change, then check this step when you're ready.";
  const isPending = needsManualCheck && !autoCheckRequested;
  const canGoNext = allowNextWhen === "pass" ? didPass : true;

  return {
    state,
    message,
    canGoNext,
    needsManualCheck,
    isPending,
    allowNextWhen,
  };
}
