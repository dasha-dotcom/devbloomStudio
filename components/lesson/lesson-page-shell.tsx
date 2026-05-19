"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

import { AppShell, type AppShellNavMode } from "@/components/app-shell";
import { CheckpointPanel } from "@/components/lesson/checkpoint-panel";
import { CodeEditor, type CodeEditorHandle } from "@/components/lesson/code-editor";
import { ErrorHelper } from "@/components/lesson/error-helper";
import { FeedbackPanel } from "@/components/lesson/feedback-panel";
import { FinishScreen } from "@/components/lesson/finish-screen";
import { ImagePicker } from "@/components/lesson/image-picker";
import { LessonProgressStrip } from "@/components/lesson/lesson-progress-strip";
import { LessonTour } from "@/components/lesson/lesson-tour";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LivePreview } from "@/components/lesson/live-preview";
import { ProjectBuilderPanel } from "@/components/lesson/project-builder-panel";
import { StepPanel } from "@/components/lesson/step-panel";
import { StepActivityPanel } from "@/components/lesson/step-activity-panel";
import { ThemePicker } from "@/components/lesson/theme-picker";
import { useProjectAttemptPersistence } from "@/hooks/use-project-attempt-persistence";
import type { ActiveEditorError } from "@/lib/editor-errors/types";
import {
  getDefaultBuilderSelections,
  getStarterCode,
  getStarterImageId,
  type LessonProjectConfig,
  type LessonStep,
} from "@/lib/projects";
import { evaluateStepFeedback, hasSubstantiveReflection, useStepFeedback } from "@/lib/lesson-feedback";
import {
  createFreshProjectAttempt,
  getDefaultEditorTabId,
  resolveSavedStepId,
  type ProjectAttempt,
  type ProjectAttemptStorage,
  type ProjectAttemptStatus,
} from "@/lib/persistence/project-attempts";

const DEFAULT_EDITOR_WIDTH = 64;
const MIN_PANE_WIDTH = 320;

type PaneMode = "both" | "editor-only" | "preview-only";
type FinalExitState = "idle" | "saving" | "saved" | "error";

type LessonPageShellProps = {
  project: LessonProjectConfig;
  storage?: ProjectAttemptStorage;
  autosaveDelayMs?: number;
  projectsHref?: string;
  navMode?: AppShellNavMode;
};

const normalizeForCompare = (value: string) => value.replace(/\s+/g, " ").trim();

const hasAnyCodeChange = (currentCode: string, previousCode: string) =>
  normalizeForCompare(currentCode) !== normalizeForCompare(previousCode);

const getStepEditorTabId = (step: LessonStep) => step.defaultEditorTabId ?? step.editorTabs?.[0]?.id ?? "default";

export function LessonPageShell({
  project,
  storage,
  autosaveDelayMs,
  projectsHref = "/projects",
  navMode,
}: LessonPageShellProps) {
  const lastLessonIndex = project.steps.length - 1;
  const firstStep = project.steps[0];
  const [initialAttempt] = useState(() => createFreshProjectAttempt(project));
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [builderSelections, setBuilderSelections] = useState(() => getDefaultBuilderSelections(project));
  const [activeEditorTabId, setActiveEditorTabId] = useState(() => firstStep.defaultEditorTabId ?? firstStep.editorTabs?.[0]?.id ?? "default");
  const [code, setCode] = useState(() => getStarterCode(project, firstStep, getDefaultBuilderSelections(project)));
  const [selectedThemeId, setSelectedThemeId] = useState(project.defaultThemeId ?? "");
  const [selectedImageId, setSelectedImageId] = useState(() =>
    getStarterImageId(project, getStarterCode(project, firstStep, getDefaultBuilderSelections(project))),
  );
  const [manualChecksByStep, setManualChecksByStep] = useState<Record<string, boolean>>({});
  const [predictionAnswersByStep, setPredictionAnswersByStep] = useState<Record<string, number>>({});
  const [activityAnswersByStep, setActivityAnswersByStep] = useState<Record<string, Record<string, number>>>({});
  const [checkpointAnswersByStep, setCheckpointAnswersByStep] = useState<Record<string, Record<string, number>>>({});
  const [checkpointSubmittedByStep, setCheckpointSubmittedByStep] = useState<Record<string, boolean>>({});
  const [reflectionResponses, setReflectionResponses] = useState<Record<string, string>>({});
  const [textEntryResponses, setTextEntryResponses] = useState<Record<string, string>>({});
  const [builderTouchedByStep, setBuilderTouchedByStep] = useState<Record<string, Record<string, boolean>>>({});
  const [imagePickerTouchedByStep, setImagePickerTouchedByStep] = useState<Record<string, boolean>>({});
  const [themePickerTouchedByStep, setThemePickerTouchedByStep] = useState<Record<string, boolean>>({});
  const [stepStartCodeByStep, setStepStartCodeByStep] = useState<Record<string, string>>(() => ({
    [firstStep.id]: getStarterCode(project, firstStep, getDefaultBuilderSelections(project)),
  }));
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [paneMode, setPaneMode] = useState<PaneMode>("both");
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [activeEditorError, setActiveEditorError] = useState<ActiveEditorError | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasDismissedAutoTourThisSession, setHasDismissedAutoTourThisSession] = useState(false);
  const [tourSessionKey, setTourSessionKey] = useState(0);
  const [finalExitState, setFinalExitState] = useState<FinalExitState>("idle");
  const editorHandleRef = useRef<CodeEditorHandle | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const lessonMainRef = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef({ pointerX: 0, editorWidth: DEFAULT_EDITOR_WIDTH });
  const shouldScrollStepToTopRef = useRef(false);
  const skipAutosaveRef = useRef(false);
  const attemptMetaRef = useRef({
    attemptId: initialAttempt.attemptId,
    startedAt: initialAttempt.startedAt,
    finishedAt: initialAttempt.finishedAt,
    finalCodeSnapshot: initialAttempt.finalCodeSnapshot,
  });

  const step = project.steps[currentStep];
  const onboardingTour = project.onboardingTour;
  const isTourEnabled = Boolean(onboardingTour?.enabled);
  const hasReachedTourTrigger = isTourEnabled && currentStep >= (onboardingTour?.triggerStepIndex ?? Number.POSITIVE_INFINITY);
  const starterCode = useMemo(
    () => getStarterCode(project, step, builderSelections),
    [builderSelections, project, step],
  );
  const editorTabs = step.editorTabs ?? [
    {
      id: "default",
      label: project.editorBadgeLabel,
      language: project.editorLanguage,
      badgeLabel: project.editorBadgeLabel,
    },
  ];
  const activeEditorTab =
    editorTabs.find((item) => item.id === activeEditorTabId) ??
    editorTabs[0];
  const activeEditorModelKey = `${step.id}:${activeEditorTab.id}`;
  const usesActiveTabReset =
    project.resetBehavior === "active-tab" &&
    Boolean(project.getEditorCodeSlice && project.applyEditorCodeSlice);
  const editorCode = useMemo(
    () =>
      project.getEditorCodeSlice?.({
        code,
        step,
        editorTabId: activeEditorTab.id,
      }) ??
      project.transformStepCode?.({ code, step, surface: "editor" }) ??
      code,
    [activeEditorTab.id, code, project, step],
  );
  const starterEditorCode = useMemo(
    () =>
      project.getEditorCodeSlice?.({
        code: starterCode,
        step,
        editorTabId: activeEditorTab.id,
      }) ??
      project.transformStepCode?.({ code: starterCode, step, surface: "editor" }) ??
      starterCode,
    [activeEditorTab.id, project, starterCode, step],
  );
  const previewCode = useMemo(
    () => project.transformStepCode?.({ code, step, surface: "preview" }) ?? code,
    [code, project, step],
  );
  const previewDoc = useMemo(
    () =>
      project.buildPreviewDocument({
        code: previewCode,
        selectedThemeId,
        selectedImageId,
      }),
    [previewCode, project, selectedImageId, selectedThemeId],
  );
  const checkpointAnswers = checkpointAnswersByStep[step.id] ?? {};
  const predictionAnswer = predictionAnswersByStep[step.id] ?? null;
  const activityAnswers = activityAnswersByStep[step.id] ?? {};
  const reflectionResponse = reflectionResponses[step.id] ?? "";
  const textEntryResponse = textEntryResponses[step.id] ?? "";
  const stepStartCode = stepStartCodeByStep[step.id] ?? starterCode;
  const stepStartEditorCode = useMemo(
    () =>
      project.getEditorCodeSlice?.({
        code: stepStartCode,
        step,
        editorTabId: activeEditorTab.id,
      }) ??
      project.transformStepCode?.({ code: stepStartCode, step, surface: "editor" }) ??
      stepStartCode,
    [activeEditorTab.id, project, step, stepStartCode],
  );
  const resetButtonLabel = useMemo(() => {
    if (!usesActiveTabReset) {
      return "Reset";
    }

    if (activeEditorTab.id === "html") {
      return "Reset HTML";
    }

    if (activeEditorTab.id === "css") {
      return "Reset CSS";
    }

    if (activeEditorTab.id === "javascript") {
      return "Reset JS";
    }

    return "Reset";
  }, [activeEditorTab.id, usesActiveTabReset]);
  const isResetDisabled = usesActiveTabReset
    ? editorCode === starterEditorCode
    : code === starterCode;
  const feedback = useStepFeedback({
    step,
    code,
    starterCode,
    stepStartCode,
    editorCode,
    starterEditorCode,
    stepStartEditorCode,
    autoCheckRequested: Boolean(manualChecksByStep[step.id]),
    checkpointAnswers,
    checkpointSubmitted: Boolean(checkpointSubmittedByStep[step.id]),
    reflectionResponse,
  });
  const completedStepIds = useMemo(
    () =>
      project.steps
        .filter((projectStep) => {
          const stepIndex = project.steps.findIndex(({ id }) => id === projectStep.id);
          const isReadOnlyIntroStep =
            projectStep.countsTowardProgress === false &&
            !projectStep.showEditor &&
            !projectStep.showBuilder &&
            !projectStep.showImagePicker &&
            !projectStep.showThemePicker &&
            !projectStep.prediction &&
            !projectStep.activity &&
            (!projectStep.feedbackMode || projectStep.feedbackMode === "none");

          if (isReadOnlyIntroStep) {
            return currentStep > stepIndex;
          }

          const rendersActivity = Boolean(projectStep.activity && !(projectStep.feedbackMode === "checkpoint" && projectStep.checkpoint));
          const activityQuestionCount = projectStep.activity?.questions.length ?? 0;
          const currentStarterCode = getStarterCode(project, projectStep, builderSelections);
          const currentStepStartCode = stepStartCodeByStep[projectStep.id];
          const hasEnteredStep = currentStepStartCode !== undefined;

          if (!hasEnteredStep && projectStep.id !== firstStep.id) {
            return false;
          }

          const effectiveStepStartCode = currentStepStartCode ?? currentStarterCode;
          const editorTabId = getStepEditorTabId(projectStep);
          const currentEditorCode =
            project.getEditorCodeSlice?.({
              code,
              step: projectStep,
              editorTabId,
            }) ??
            project.transformStepCode?.({ code, step: projectStep, surface: "editor" }) ??
            code;
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
            code,
            starterCode: currentStarterCode,
            stepStartCode: effectiveStepStartCode,
            editorCode: currentEditorCode,
            starterEditorCode: currentStarterEditorCode,
            stepStartEditorCode: currentStepStartEditorCode,
            autoCheckRequested: Boolean(manualChecksByStep[projectStep.id]),
            checkpointAnswers: checkpointAnswersByStep[projectStep.id] ?? {},
            checkpointSubmitted: Boolean(checkpointSubmittedByStep[projectStep.id]),
            reflectionResponse: reflectionResponses[projectStep.id] ?? "",
          });

          const requiresFeedbackCheck = projectStep.feedbackMode && projectStep.feedbackMode !== "none";
          const feedbackDone = !requiresFeedbackCheck || stepFeedback.state === "pass";
          const predictionDone = !projectStep.prediction || predictionAnswersByStep[projectStep.id] !== undefined;
          const activityDone =
            !rendersActivity ||
            Object.keys(activityAnswersByStep[projectStep.id] ?? {}).length === activityQuestionCount;
          const builderDone =
            !projectStep.showBuilder ||
            (project.builder?.questions.every((question) => builderTouchedByStep[projectStep.id]?.[question.id]) ??
              false);
          const imagePickerDone = !projectStep.showImagePicker || Boolean(imagePickerTouchedByStep[projectStep.id]);
          const themePickerDone = !projectStep.showThemePicker || Boolean(themePickerTouchedByStep[projectStep.id]);
          const needsCodeEditCheck =
            projectStep.showEditor &&
            !projectStep.showImagePicker &&
            !projectStep.showThemePicker &&
            !projectStep.showBuilder &&
            !requiresFeedbackCheck;
          const codeEditDone = !needsCodeEditCheck || hasAnyCodeChange(currentEditorCode, currentStepStartEditorCode);
          const hasTrackedRequirement =
            requiresFeedbackCheck ||
            Boolean(projectStep.prediction) ||
            rendersActivity ||
            Boolean(projectStep.showBuilder) ||
            Boolean(projectStep.showImagePicker) ||
            Boolean(projectStep.showThemePicker) ||
            needsCodeEditCheck;

          if (!hasTrackedRequirement) {
            return false;
          }

          return (
            feedbackDone &&
            predictionDone &&
            activityDone &&
            builderDone &&
            imagePickerDone &&
            themePickerDone &&
            codeEditDone
          );
        })
        .map((projectStep) => projectStep.id),
    [
      activityAnswersByStep,
      builderSelections,
      builderTouchedByStep,
      checkpointAnswersByStep,
      checkpointSubmittedByStep,
      code,
      currentStep,
      imagePickerTouchedByStep,
      manualChecksByStep,
      project,
      predictionAnswersByStep,
      reflectionResponses,
      stepStartCodeByStep,
      themePickerTouchedByStep,
      firstStep.id,
    ],
  );
  const progressSummary = useMemo(() => {
    const progressSteps = project.steps.filter((projectStep) => projectStep.countsTowardProgress !== false);
    const completedStepIdSet = new Set(completedStepIds);
    const completedProgressSteps = progressSteps.filter((projectStep) => completedStepIdSet.has(projectStep.id)).length;
    const totalProgressSteps = progressSteps.length;
    const progressPercent = Math.round((completedProgressSteps / Math.max(totalProgressSteps, 1)) * 100);

    return {
      completedProgressSteps,
      totalProgressSteps,
      progressPercent,
    };
  }, [completedStepIds, project.steps]);
  const notebookReflection = useMemo(() => {
    const lastStep = project.steps[lastLessonIndex];
    const candidateStep =
      lastStep?.feedbackMode === "reflection"
        ? lastStep
        : [...project.steps].reverse().find((projectStep) => projectStep.feedbackMode === "reflection");

    if (!candidateStep) {
      return undefined;
    }

    const candidateResponse = reflectionResponses[candidateStep.id] ?? "";
    const trimmedResponse = candidateResponse.trim();

    if (!hasSubstantiveReflection(trimmedResponse)) {
      return undefined;
    }

    return {
      entry: trimmedResponse,
      prompt: candidateStep.reflectionPrompt,
    };
  }, [lastLessonIndex, project.steps, reflectionResponses]);

  const buildAttemptSnapshot = useCallback((overrides: {
    status?: ProjectAttemptStatus;
    currentStepId?: string;
    activeEditorTabId?: string;
    latestCode?: string;
    selectedThemeId?: string;
    selectedImageId?: string;
    builderSelections?: Record<string, string>;
    predictionAnswersByStep?: Record<string, number>;
    activityAnswersByStep?: Record<string, Record<string, number>>;
    checkpointAnswersByStep?: Record<string, Record<string, number>>;
    checkpointSubmittedByStep?: Record<string, boolean>;
    reflectionResponses?: Record<string, string>;
    textEntryResponses?: Record<string, string>;
    builderTouchedByStep?: Record<string, Record<string, boolean>>;
    imagePickerTouchedByStep?: Record<string, boolean>;
    themePickerTouchedByStep?: Record<string, boolean>;
    stepStartCodeByStep?: Record<string, string>;
    progressPercent?: number;
    finishedAt?: string | null;
    finalCodeSnapshot?: string;
  } = {}): ProjectAttempt => {
    const status = overrides.status ?? (isComplete ? "completed" : "in_progress");
    const finishedAt =
      status === "completed"
        ? overrides.finishedAt ?? attemptMetaRef.current.finishedAt ?? new Date().toISOString()
        : null;
    const finalCodeSnapshot =
      status === "completed"
        ? overrides.finalCodeSnapshot ?? attemptMetaRef.current.finalCodeSnapshot ?? (overrides.latestCode ?? code)
        : undefined;

    return {
      schemaVersion: 1,
      attemptId: attemptMetaRef.current.attemptId,
      projectSlug: project.slug,
      contentVersion: project.contentVersion,
      status,
      currentStepId: overrides.currentStepId ?? step.id,
      activeEditorTabId: overrides.activeEditorTabId ?? activeEditorTabId,
      progressPercent: overrides.progressPercent ?? progressSummary.progressPercent,
      latestCode: overrides.latestCode ?? code,
      selectedThemeId: overrides.selectedThemeId ?? selectedThemeId,
      selectedImageId: overrides.selectedImageId ?? selectedImageId,
      builderSelections: overrides.builderSelections ?? builderSelections,
      predictionAnswersByStep: overrides.predictionAnswersByStep ?? predictionAnswersByStep,
      activityAnswersByStep: overrides.activityAnswersByStep ?? activityAnswersByStep,
      checkpointAnswersByStep: overrides.checkpointAnswersByStep ?? checkpointAnswersByStep,
      checkpointSubmittedByStep: overrides.checkpointSubmittedByStep ?? checkpointSubmittedByStep,
      reflectionResponses: overrides.reflectionResponses ?? reflectionResponses,
      textEntryResponses: overrides.textEntryResponses ?? textEntryResponses,
      builderTouchedByStep: overrides.builderTouchedByStep ?? builderTouchedByStep,
      imagePickerTouchedByStep: overrides.imagePickerTouchedByStep ?? imagePickerTouchedByStep,
      themePickerTouchedByStep: overrides.themePickerTouchedByStep ?? themePickerTouchedByStep,
      stepStartCodeByStep: overrides.stepStartCodeByStep ?? stepStartCodeByStep,
      startedAt: attemptMetaRef.current.startedAt,
      lastActiveAt: new Date().toISOString(),
      finishedAt,
      finalCodeSnapshot,
    };
  }, [
    activeEditorTabId,
    activityAnswersByStep,
    builderSelections,
    builderTouchedByStep,
    checkpointAnswersByStep,
    checkpointSubmittedByStep,
    code,
    imagePickerTouchedByStep,
    isComplete,
    predictionAnswersByStep,
    progressSummary.progressPercent,
    project.contentVersion,
    project.slug,
    reflectionResponses,
    textEntryResponses,
    selectedImageId,
    selectedThemeId,
    step.id,
    stepStartCodeByStep,
    themePickerTouchedByStep,
  ]);

  const hydrateAttempt = useCallback((attempt: ProjectAttempt | null) => {
    skipAutosaveRef.current = true;

    if (!attempt) {
      attemptMetaRef.current = {
        attemptId: initialAttempt.attemptId,
        startedAt: initialAttempt.startedAt,
        finishedAt: null,
        finalCodeSnapshot: undefined,
      };
      return;
    }

    attemptMetaRef.current = {
      attemptId: attempt.attemptId,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      finalCodeSnapshot: attempt.finalCodeSnapshot,
    };

    const resolvedStepId = resolveSavedStepId(
      project,
      attempt.currentStepId,
      attempt.status === "completed" ? "last" : "first",
    );
    const stepIndex = project.steps.findIndex((projectStep) => projectStep.id === resolvedStepId);

    setCurrentStep(stepIndex === -1 ? 0 : stepIndex);
    setIsComplete(attempt.status === "completed");
    setBuilderSelections(attempt.builderSelections);
    setActiveEditorTabId(attempt.activeEditorTabId);
    setCode(attempt.latestCode);
    setSelectedThemeId(attempt.selectedThemeId);
    setSelectedImageId(attempt.selectedImageId);
    setPredictionAnswersByStep(attempt.predictionAnswersByStep);
    setActivityAnswersByStep(attempt.activityAnswersByStep);
    setCheckpointAnswersByStep(attempt.checkpointAnswersByStep);
    setCheckpointSubmittedByStep(attempt.checkpointSubmittedByStep);
    setReflectionResponses(attempt.reflectionResponses);
    setTextEntryResponses(attempt.textEntryResponses);
    setBuilderTouchedByStep(attempt.builderTouchedByStep);
    setImagePickerTouchedByStep(attempt.imagePickerTouchedByStep);
    setThemePickerTouchedByStep(attempt.themePickerTouchedByStep);
    setStepStartCodeByStep(attempt.stepStartCodeByStep);
    setGateMessage(null);
    setActiveEditorError(null);
  }, [initialAttempt, project]);

  const { hasHydrated, saveState, queueSave, saveNow, clearSavedAttempt } = useProjectAttemptPersistence({
    project,
    storage,
    autosaveDelayMs,
    onHydrate: hydrateAttempt,
  });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    queueSave(buildAttemptSnapshot());
  }, [
    activeEditorTabId,
    activityAnswersByStep,
    builderSelections,
    builderTouchedByStep,
    checkpointAnswersByStep,
    checkpointSubmittedByStep,
    code,
    currentStep,
    hasHydrated,
    imagePickerTouchedByStep,
    isComplete,
    predictionAnswersByStep,
    progressSummary.progressPercent,
    buildAttemptSnapshot,
    queueSave,
    reflectionResponses,
    textEntryResponses,
    selectedImageId,
    selectedThemeId,
    stepStartCodeByStep,
    themePickerTouchedByStep,
  ]);

  const persistImmediately = (attempt: ProjectAttempt) => {
    skipAutosaveRef.current = true;
    attemptMetaRef.current = {
      attemptId: attempt.attemptId,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      finalCodeSnapshot: attempt.finalCodeSnapshot,
    };
    void saveNow(attempt);
  };

  const saveAndExit = async () => {
    setFinalExitState("saving");
    const saved = await saveNow(buildAttemptSnapshot({ status: "completed" }));
    setFinalExitState(saved ? "saved" : "error");
  };

  const goNext = () => {
    if (step.isGate && !feedback.canGoNext) {
      setGateMessage("This step needs one more check before you move on.");
      return;
    }

    setGateMessage(null);

    if (currentStep === lastLessonIndex) {
      const finishedAt = new Date().toISOString();
      const completedAttempt = buildAttemptSnapshot({
        status: "completed",
        finishedAt,
        finalCodeSnapshot: code,
      });

      setIsComplete(true);
      persistImmediately(completedAttempt);
      return;
    }

    const nextStepIndex = Math.min(currentStep + 1, lastLessonIndex);
    const nextStep = project.steps[nextStepIndex];
    const nextStepStartCodeByStep = {
      ...stepStartCodeByStep,
      [nextStep.id]: code,
    };
    const nextActiveEditorTabId = nextStep.defaultEditorTabId ?? nextStep.editorTabs?.[0]?.id ?? "default";

    setActiveEditorError(null);
    setStepStartCodeByStep(nextStepStartCodeByStep);
    setActiveEditorTabId(nextActiveEditorTabId);
    shouldScrollStepToTopRef.current = true;
    setCurrentStep(nextStepIndex);
    persistImmediately(
      buildAttemptSnapshot({
        currentStepId: nextStep.id,
        activeEditorTabId: nextActiveEditorTabId,
        stepStartCodeByStep: nextStepStartCodeByStep,
      }),
    );
  };
  const goBack = () => {
    const previousStepIndex = Math.max(currentStep - 1, 0);
    const previousStep = project.steps[previousStepIndex];
    const previousActiveEditorTabId = previousStep.defaultEditorTabId ?? previousStep.editorTabs?.[0]?.id ?? "default";

    setActiveEditorError(null);
    setGateMessage(null);
    setActiveEditorTabId(previousActiveEditorTabId);
    setCurrentStep(previousStepIndex);
    persistImmediately(
      buildAttemptSnapshot({
        currentStepId: previousStep.id,
        activeEditorTabId: previousActiveEditorTabId,
      }),
    );
  };
  const resetCode = () => {
    const nextCode = usesActiveTabReset
      ? (project.applyEditorCodeSlice?.({
          currentCode: code,
          nextSliceCode: starterEditorCode,
          step,
          editorTabId: activeEditorTab.id,
        }) ?? code)
      : starterCode;

    setCode(nextCode);
    setManualChecksByStep((current) => ({ ...current, [step.id]: false }));
    const nextSelectedImageId = getStarterImageId(project, nextCode);
    setSelectedImageId(nextSelectedImageId);
    persistImmediately(
      buildAttemptSnapshot({
        latestCode: nextCode,
        selectedImageId: nextSelectedImageId,
      }),
    );
  };

  const restart = () => {
    const shouldClear = window.confirm("Clear your saved progress for this project and start over?");

    if (!shouldClear) {
      return;
    }

    const freshAttempt = createFreshProjectAttempt(project);
    const nextAttempt = {
      ...freshAttempt,
      attemptId: attemptMetaRef.current.attemptId,
    };
    attemptMetaRef.current = {
      attemptId: nextAttempt.attemptId,
      startedAt: nextAttempt.startedAt,
      finishedAt: null,
      finalCodeSnapshot: undefined,
    };

    clearSavedAttempt();
    setFinalExitState("idle");
    setIsComplete(false);
    setActiveEditorError(null);
    setCurrentStep(0);
    setBuilderSelections(nextAttempt.builderSelections);
    setActiveEditorTabId(firstStep.defaultEditorTabId ?? firstStep.editorTabs?.[0]?.id ?? "default");
    setCode(nextAttempt.latestCode);
    setSelectedThemeId(project.defaultThemeId ?? "");
    setSelectedImageId(nextAttempt.selectedImageId);
    setManualChecksByStep({});
    setPredictionAnswersByStep({});
    setActivityAnswersByStep({});
    setCheckpointAnswersByStep({});
    setCheckpointSubmittedByStep({});
    setReflectionResponses({});
    setTextEntryResponses({});
    setBuilderTouchedByStep({});
    setImagePickerTouchedByStep({});
    setThemePickerTouchedByStep({});
    setStepStartCodeByStep(nextAttempt.stepStartCodeByStep);
    setGateMessage(null);
  };

  const continueEditing = () => {
    const resumeStepId = resolveSavedStepId(project, step.id, "last");
    const resumeStepIndex = project.steps.findIndex((projectStep) => projectStep.id === resumeStepId);
    const safeStepIndex = resumeStepIndex === -1 ? 0 : resumeStepIndex;
    const resumeStep = project.steps[safeStepIndex];
    const resumeActiveEditorTabId =
      resumeStep.editorTabs?.some((tab) => tab.id === activeEditorTabId)
        ? activeEditorTabId
        : getDefaultEditorTabId(project, resumeStep.id);
    const resumedAttempt = buildAttemptSnapshot({
      status: "in_progress",
      currentStepId: resumeStep.id,
      activeEditorTabId: resumeActiveEditorTabId,
      finishedAt: null,
    });

    setIsComplete(false);
    setFinalExitState("idle");
    setActiveEditorError(null);
    setGateMessage(null);
    setCurrentStep(safeStepIndex);
    setActiveEditorTabId(resumeActiveEditorTabId);
    persistImmediately(resumedAttempt);
  };

  const updateEditorCode = (nextValue: string) => {
    setManualChecksByStep((current) => ({ ...current, [step.id]: false }));

    if (project.applyEditorCodeSlice) {
      setCode((currentCode) =>
        project.applyEditorCodeSlice?.({
          currentCode,
          nextSliceCode: nextValue,
          step,
          editorTabId: activeEditorTab.id,
        }) ?? currentCode,
      );
      return;
    }

    setCode(nextValue);
  };

  const clampEditorWidth = useCallback((nextWidth: number) => {
    const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? 0;

    if (!workspaceWidth) {
      return Math.max(40, Math.min(65, nextWidth));
    }

    const minWidthPercentage = (MIN_PANE_WIDTH / workspaceWidth) * 100;
    const minimum = Math.max(40, minWidthPercentage);
    const maximum = Math.min(65, 100 - minWidthPercentage);

    return Math.max(minimum, Math.min(maximum, nextWidth));
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? 0;

      if (!workspaceWidth) {
        return;
      }

      const widthDelta = event.clientX - dragStartRef.current.pointerX;
      const nextWidth = dragStartRef.current.editorWidth + (widthDelta / workspaceWidth) * 100;

      setEditorWidth(clampEditorWidth(nextWidth));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [clampEditorWidth, isResizing]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactViewport(window.innerWidth <= 1120);
      setEditorWidth((currentWidth) => clampEditorWidth(currentWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampEditorWidth]);

  const openTour = useCallback(() => {
    setPaneMode("both");
    setEditorWidth((currentWidth) => clampEditorWidth(currentWidth));
    setTourSessionKey((current) => current + 1);
    setIsTourOpen(true);
  }, [clampEditorWidth]);

  useEffect(() => {
    if (
      !isTourEnabled ||
      !onboardingTour ||
      currentStep !== onboardingTour.triggerStepIndex ||
      hasDismissedAutoTourThisSession ||
      isComplete ||
      isTourOpen
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      openTour();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentStep,
    hasDismissedAutoTourThisSession,
    isComplete,
    isTourEnabled,
    isTourOpen,
    onboardingTour,
    openTour,
  ]);

  useEffect(() => {
    if (!shouldScrollStepToTopRef.current) {
      return;
    }

    shouldScrollStepToTopRef.current = false;
    lessonMainRef.current?.scrollIntoView({ block: "start" });
  }, [currentStep]);

  const showBothPanes = () => {
    setPaneMode("both");
    setEditorWidth((currentWidth) => clampEditorWidth(currentWidth));
  };

  const showEditorOnly = () => {
    setPaneMode("editor-only");
  };

  const showPreviewOnly = () => {
    setPaneMode("preview-only");
  };

  const dismissTour = () => {
    setHasDismissedAutoTourThisSession(true);
    setIsTourOpen(false);
    window.requestAnimationFrame(() => {
      lessonMainRef.current?.scrollIntoView({ block: "start" });
    });
  };

  const reopenTour = () => {
    openTour();
  };

  const selectImage = (imageId: string) => {
    const image = project.imageOptions?.find((item) => item.id === imageId);
    const nextImagePickerTouchedByStep = { ...imagePickerTouchedByStep, [step.id]: true };
    const nextCode = image && project.onSelectImage ? project.onSelectImage(code, image) ?? code : code;

    setSelectedImageId(imageId);
    setImagePickerTouchedByStep(nextImagePickerTouchedByStep);

    if (!image || !project.onSelectImage) {
      persistImmediately(
        buildAttemptSnapshot({
          selectedImageId: imageId,
          imagePickerTouchedByStep: nextImagePickerTouchedByStep,
        }),
      );
      return;
    }

    setCode(nextCode);
    persistImmediately(
      buildAttemptSnapshot({
        latestCode: nextCode,
        selectedImageId: imageId,
        imagePickerTouchedByStep: nextImagePickerTouchedByStep,
      }),
    );
  };

  const updateBuilderSelection = (questionId: string, optionId: string) => {
    const nextBuilderTouchedByStep = {
      ...builderTouchedByStep,
      [step.id]: {
        ...(builderTouchedByStep[step.id] ?? {}),
        [questionId]: true,
      },
    };
    const nextSelections = {
      ...builderSelections,
      [questionId]: optionId,
    };
    const nextStarterCode = step.showBuilder ? getStarterCode(project, step, nextSelections) : code;
    const nextSelectedImageId = step.showBuilder ? getStarterImageId(project, nextStarterCode) : selectedImageId;

    setBuilderTouchedByStep(nextBuilderTouchedByStep);
    setBuilderSelections(nextSelections);

    if (step.showBuilder) {
      setCode(nextStarterCode);
      setSelectedImageId(nextSelectedImageId);
    }

    persistImmediately(
      buildAttemptSnapshot({
        builderSelections: nextSelections,
        builderTouchedByStep: nextBuilderTouchedByStep,
        latestCode: nextStarterCode,
        selectedImageId: nextSelectedImageId,
      }),
    );
  };

  const updatePredictionAnswer = (optionIndex: number) => {
    const nextPredictionAnswersByStep = {
      ...predictionAnswersByStep,
      [step.id]: optionIndex,
    };

    setPredictionAnswersByStep(nextPredictionAnswersByStep);
    persistImmediately(
      buildAttemptSnapshot({
        predictionAnswersByStep: nextPredictionAnswersByStep,
      }),
    );
  };

  const updateActivityAnswer = (questionId: string, optionIndex: number) => {
    const nextActivityAnswersByStep = {
      ...activityAnswersByStep,
      [step.id]: {
        ...(activityAnswersByStep[step.id] ?? {}),
        [questionId]: optionIndex,
      },
    };

    setActivityAnswersByStep(nextActivityAnswersByStep);
    persistImmediately(
      buildAttemptSnapshot({
        activityAnswersByStep: nextActivityAnswersByStep,
      }),
    );
  };

  const updateCheckpointAnswer = (questionId: string, optionIndex: number) => {
    setGateMessage(null);
    const nextCheckpointAnswersByStep = {
      ...checkpointAnswersByStep,
      [step.id]: {
        ...(checkpointAnswersByStep[step.id] ?? {}),
        [questionId]: optionIndex,
      },
    };
    const nextCheckpointSubmittedByStep = {
      ...checkpointSubmittedByStep,
      [step.id]: false,
    };

    setCheckpointAnswersByStep(nextCheckpointAnswersByStep);
    setCheckpointSubmittedByStep(nextCheckpointSubmittedByStep);
    persistImmediately(
      buildAttemptSnapshot({
        checkpointAnswersByStep: nextCheckpointAnswersByStep,
        checkpointSubmittedByStep: nextCheckpointSubmittedByStep,
      }),
    );
  };

  const submitCheckpoint = () => {
    const nextCheckpointSubmittedByStep = {
      ...checkpointSubmittedByStep,
      [step.id]: true,
    };

    setCheckpointSubmittedByStep(nextCheckpointSubmittedByStep);
    persistImmediately(
      buildAttemptSnapshot({
        checkpointSubmittedByStep: nextCheckpointSubmittedByStep,
      }),
    );
  };

  const runManualCheck = () => {
    setManualChecksByStep((current) => ({
      ...current,
      [step.id]: true,
    }));
  };

  const updateThemeSelection = (themeId: string) => {
    const nextThemePickerTouchedByStep = { ...themePickerTouchedByStep, [step.id]: true };

    setSelectedThemeId(themeId);
    setThemePickerTouchedByStep(nextThemePickerTouchedByStep);
    persistImmediately(
      buildAttemptSnapshot({
        selectedThemeId: themeId,
        themePickerTouchedByStep: nextThemePickerTouchedByStep,
      }),
    );
  };

  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (isCompactViewport || paneMode !== "both") {
      return;
    }

    dragStartRef.current = {
      pointerX: event.clientX,
      editorWidth,
    };
    setIsResizing(true);
  };

  const workspaceColumns =
    paneMode === "both" && !isCompactViewport
      ? `minmax(${MIN_PANE_WIDTH}px, ${editorWidth}%) 16px minmax(${MIN_PANE_WIDTH}px, ${
          100 - editorWidth
        }%)`
      : undefined;

  if (storage && !hasHydrated) {
    return (
      <AppShell navMode={navMode}>
        <div className="lesson-shell lesson-shell-loading">
          <section className="lesson-workspace-shell">
            <div className="lesson-loading-card">
              <p className="lesson-loading-eyebrow">Loading saved project</p>
              <h1>Restoring your work...</h1>
              <p>Hold on for a second while your saved attempt loads.</p>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (isComplete) {
    return (
      <AppShell navMode={navMode}>
        <FinishScreen
          srcDoc={previewDoc}
          onContinueEditing={continueEditing}
          onStartOver={restart}
          onSaveAndExit={saveAndExit}
          content={project.finish}
          progressPercent={progressSummary.progressPercent}
          notebookEntry={notebookReflection?.entry}
          notebookPrompt={notebookReflection?.prompt}
          sandbox={project.previewSandbox}
          projectsHref={projectsHref}
          showSaveAndExit={projectsHref === "/student/projects"}
          saveAndExitState={finalExitState}
        />
      </AppShell>
    );
  }

  return (
    <AppShell navMode={navMode}>
      <div className="lesson-shell">
        {isCompactViewport ? (
          <LessonSidebar
            steps={project.steps}
            currentStep={currentStep}
            completedStepIds={completedStepIds}
            progressPercent={progressSummary.progressPercent}
            completedProgressSteps={progressSummary.completedProgressSteps}
            totalProgressSteps={progressSummary.totalProgressSteps}
            meta={project.sidebar}
          />
        ) : null}

        <section className="lesson-workspace-shell">
          {!isCompactViewport ? (
            <LessonProgressStrip
              steps={project.steps}
              currentStep={currentStep}
              completedStepIds={completedStepIds}
            />
          ) : null}

          <div className="lesson-workspace-toolbar">
            <div className="pill-row">
              <span className="pill">Workspace</span>
              <span className="pill">Drag to resize</span>
              <span className="pill">Hide either pane</span>
            </div>
            <div className="lesson-toolbar-actions">
              <span className={`save-status save-status-${saveState}`} aria-live="polite">
                {saveState === "saving" ? "Saving..." : saveState === "error" ? "Save error" : "Saved"}
              </span>
              {hasReachedTourTrigger ? (
                <button
                  type="button"
                  className="lesson-tour-trigger"
                  onClick={reopenTour}
                >
                  Show tour again
                </button>
              ) : null}
              <div className="pane-toggle-group" role="group" aria-label="Workspace layout">
                <button
                  type="button"
                  className={paneMode === "both" ? "pane-toggle active" : "pane-toggle"}
                  onClick={showBothPanes}
                >
                  Show both
                </button>
                <button
                  type="button"
                  className={paneMode === "editor-only" ? "pane-toggle active" : "pane-toggle"}
                  onClick={showEditorOnly}
                >
                  Editor only
                </button>
                <button
                  type="button"
                  className={paneMode === "preview-only" ? "pane-toggle active" : "pane-toggle"}
                  onClick={showPreviewOnly}
                >
                  Preview only
                </button>
              </div>
            </div>
          </div>

          <div
            ref={workspaceRef}
            className={`lesson-workspace pane-mode-${paneMode}`}
            style={workspaceColumns ? { gridTemplateColumns: workspaceColumns } : undefined}
          >
            {paneMode !== "preview-only" ? (
              <main ref={lessonMainRef} className="lesson-main lesson-editor-pane">
                <StepPanel
                  step={step}
                  predictionAnswer={predictionAnswer}
                  onPredictionAnswer={updatePredictionAnswer}
                  textEntryValue={textEntryResponse}
                  onTextEntryChange={(value) => {
                    setTextEntryResponses((current) => ({
                      ...current,
                      [step.id]: value,
                    }));
                  }}
                />

                {step.showEditor ? (
                  <>
                    {editorTabs.length > 1 ? (
                      <div className="editor-tab-row">
                        {editorTabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            className={`editor-tab ${tab.id === activeEditorTab.id ? "active" : ""}`}
                            onClick={() => {
                              setActiveEditorError(null);
                              setActiveEditorTabId(tab.id);
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <CodeEditor
                      ref={editorHandleRef}
                      key={activeEditorModelKey}
                      stepId={step.id}
                      modelKey={activeEditorModelKey}
                      value={editorCode}
                      onChange={updateEditorCode}
                      focus={step.editorFocus}
                      onActiveErrorChange={setActiveEditorError}
                      language={activeEditorTab.language}
                      badgeLabel={activeEditorTab.badgeLabel}
                      readOnly={step.editorReadOnly}
                      actions={
                        <>
                          <button
                            type="button"
                            className="pane-action-button"
                            onClick={resetCode}
                            disabled={isResetDisabled}
                          >
                            {resetButtonLabel}
                          </button>
                          {paneMode === "both" ? (
                            <button
                              type="button"
                              className="pane-action-button"
                              onClick={showEditorOnly}
                            >
                              Hide preview
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="pane-action-button"
                              onClick={showBothPanes}
                            >
                              Show preview
                            </button>
                          )}
                        </>
                      }
                    />

                    {activeEditorError ? (
                      <ErrorHelper
                        key={activeEditorError.signature}
                        error={activeEditorError}
                        onShowWhere={() => {
                          if (activeEditorError.lineNumber) {
                            editorHandleRef.current?.revealLine(activeEditorError.lineNumber);
                          }
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  currentStep === 0 ? (
                    <section className="step-panel" style={{ marginTop: 18 }}>
                      <strong>{project.introCard.title}</strong>
                      <p className="muted">{project.introCard.body}</p>
                      <div className="pill-row">
                        {project.introCard.pills.map((pill) => (
                          <span key={pill} className="pill">
                            {pill}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null
                )}

                {step.feedbackMode === "checkpoint" && step.checkpoint ? (
                  <CheckpointPanel
                    checkpoint={step.checkpoint}
                    answers={checkpointAnswers}
                    onAnswer={updateCheckpointAnswer}
                    onSubmit={submitCheckpoint}
                    submitted={Boolean(checkpointSubmittedByStep[step.id])}
                  />
                ) : null}

                {step.activity && !(step.feedbackMode === "checkpoint" && step.checkpoint) ? (
                  <StepActivityPanel
                    activity={step.activity}
                    selectedAnswers={activityAnswers}
                    onAnswer={updateActivityAnswer}
                  />
                ) : null}

                {step.showBuilder && project.builder ? (
                  <ProjectBuilderPanel
                    builder={project.builder}
                    selections={builderSelections}
                    onSelect={updateBuilderSelection}
                  />
                ) : null}

                {step.showImagePicker && project.imageOptions ? (
                  <section className="step-panel" style={{ marginTop: 18 }}>
                    <strong>Choose an image</strong>
                    <p className="muted">
                      Pick the image that feels most like your page. You can switch again
                      later if you change your mind.
                    </p>
                    <ImagePicker
                      images={project.imageOptions}
                      selectedImageId={selectedImageId}
                      onSelect={selectImage}
                    />
                  </section>
                ) : null}

                {step.showThemePicker && project.themeOptions ? (
                  <section className="step-panel" style={{ marginTop: 18 }}>
                    <strong>Choose your theme</strong>
                    <p className="muted">
                      The theme changes the mood of your page without changing the code
                      you wrote.
                    </p>
                    <ThemePicker
                      themes={project.themeOptions}
                      selectedThemeId={selectedThemeId}
                      onSelect={updateThemeSelection}
                    />
                  </section>
                ) : null}

                {step.feedbackMode && step.feedbackMode !== "none" ? (
                  <FeedbackPanel
                    step={step}
                    state={feedback.state}
                    message={feedback.message}
                    isPending={feedback.isPending}
                    onManualCheck={feedback.needsManualCheck ? runManualCheck : undefined}
                    gateMessage={gateMessage}
                    reflectionResponse={reflectionResponse}
                    onReflectionChange={(value) => {
                      setReflectionResponses((current) => ({
                        ...current,
                        [step.id]: value,
                      }));
                    }}
                  />
                ) : gateMessage ? (
                  <section className="feedback-panel feedback-notYet">
                    <p className="feedback-gate-note">{gateMessage}</p>
                  </section>
                ) : null}

                <div className="lesson-footer">
                  {currentStep === 0 ? (
                    <Link href={projectsHref} className="button-ghost">
                      Back to projects
                    </Link>
                  ) : (
                    <button type="button" className="button-ghost" onClick={goBack}>
                      Back
                    </button>
                  )}

                  <button
                    type="button"
                    className="button"
                    data-tour-id="lesson-next-step"
                    onClick={goNext}
                  >
                    {currentStep === lastLessonIndex ? "Celebrate project" : currentStep === lastLessonIndex - 1 ? "Finish step" : "Next step"}
                  </button>
                </div>
              </main>
            ) : null}

            {paneMode === "both" && !isCompactViewport ? (
              <button
                type="button"
                className={`lesson-workspace-divider${isResizing ? " is-active" : ""}`}
                onPointerDown={beginResize}
                aria-label="Resize editor and preview panels"
              >
                <span className="lesson-workspace-divider-handle" />
              </button>
            ) : null}

            {paneMode !== "editor-only" ? (
              <LivePreview
                key={step.id}
                srcDoc={previewDoc}
                title={project.previewTitle?.({ selectedThemeId, selectedImageId }) ?? "Live preview"}
                sandbox={project.previewSandbox}
                actions={
                  paneMode === "both" ? (
                    <button
                      type="button"
                      className="pane-action-button"
                      onClick={showPreviewOnly}
                    >
                      Hide editor
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pane-action-button"
                      onClick={showBothPanes}
                    >
                      Show editor
                    </button>
                  )
                }
              />
            ) : null}
          </div>
        </section>
      </div>
      {isTourEnabled && onboardingTour && isTourOpen ? (
        <LessonTour
          key={tourSessionKey}
          isOpen={isTourOpen}
          steps={onboardingTour.steps}
          onSkip={dismissTour}
          onFinish={dismissTour}
        />
      ) : null}
    </AppShell>
  );
}
