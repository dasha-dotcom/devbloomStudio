"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CheckpointPanel } from "@/components/lesson/checkpoint-panel";
import { CodeEditor, type CodeEditorHandle } from "@/components/lesson/code-editor";
import { ErrorHelper } from "@/components/lesson/error-helper";
import { FeedbackPanel } from "@/components/lesson/feedback-panel";
import { FinishScreen } from "@/components/lesson/finish-screen";
import { ImagePicker } from "@/components/lesson/image-picker";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LivePreview } from "@/components/lesson/live-preview";
import { ProjectBuilderPanel } from "@/components/lesson/project-builder-panel";
import { StepPanel } from "@/components/lesson/step-panel";
import { StepActivityPanel } from "@/components/lesson/step-activity-panel";
import { ThemePicker } from "@/components/lesson/theme-picker";
import type { ActiveEditorError } from "@/lib/editor-errors/types";
import {
  getDefaultBuilderSelections,
  getStarterCode,
  getStarterImageId,
  type LessonProjectConfig,
} from "@/lib/projects";
import { hasSubstantiveReflection, useStepFeedback } from "@/lib/lesson-feedback";

const DEFAULT_EDITOR_WIDTH = 56;
const MIN_PANE_WIDTH = 320;

type PaneMode = "both" | "editor-only" | "preview-only";

type LessonPageShellProps = {
  project: LessonProjectConfig;
};

export function LessonPageShell({ project }: LessonPageShellProps) {
  const lastLessonIndex = project.steps.length - 1;
  const firstStep = project.steps[0];
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
  const [checkpointAnswersByStep, setCheckpointAnswersByStep] = useState<Record<string, Record<string, number>>>({});
  const [checkpointSubmittedByStep, setCheckpointSubmittedByStep] = useState<Record<string, boolean>>({});
  const [reflectionResponses, setReflectionResponses] = useState<Record<string, string>>({});
  const [stepStartCodeByStep, setStepStartCodeByStep] = useState<Record<string, string>>(() => ({
    [firstStep.id]: getStarterCode(project, firstStep, getDefaultBuilderSelections(project)),
  }));
  const [gateMessage, setGateMessage] = useState<string | null>(null);
  const [paneMode, setPaneMode] = useState<PaneMode>("both");
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [activeEditorError, setActiveEditorError] = useState<ActiveEditorError | null>(null);
  const editorHandleRef = useRef<CodeEditorHandle | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ pointerX: 0, editorWidth: DEFAULT_EDITOR_WIDTH });

  const step = project.steps[currentStep];
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
  const reflectionResponse = reflectionResponses[step.id] ?? "";
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

  const goNext = () => {
    if (step.isGate && !feedback.canGoNext) {
      setGateMessage("This step needs one more check before you move on.");
      return;
    }

    setGateMessage(null);

    if (currentStep === lastLessonIndex) {
      setIsComplete(true);
      return;
    }

    const nextStepIndex = Math.min(currentStep + 1, lastLessonIndex);
    const nextStep = project.steps[nextStepIndex];

    setActiveEditorError(null);
    setStepStartCodeByStep((current) => ({
      ...current,
      [nextStep.id]: code,
    }));
    setActiveEditorTabId(nextStep.defaultEditorTabId ?? nextStep.editorTabs?.[0]?.id ?? "default");
    setCurrentStep(nextStepIndex);
  };
  const goBack = () => {
    const previousStepIndex = Math.max(currentStep - 1, 0);
    const previousStep = project.steps[previousStepIndex];

    setActiveEditorError(null);
    setGateMessage(null);
    setActiveEditorTabId(previousStep.defaultEditorTabId ?? previousStep.editorTabs?.[0]?.id ?? "default");
    setCurrentStep(previousStepIndex);
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
    setSelectedImageId(getStarterImageId(project, nextCode));
  };
  const restart = () => {
    const defaultSelections = getDefaultBuilderSelections(project);
    setIsComplete(false);
    setActiveEditorError(null);
    setCurrentStep(0);
    setBuilderSelections(defaultSelections);
    setActiveEditorTabId(firstStep.defaultEditorTabId ?? firstStep.editorTabs?.[0]?.id ?? "default");
    setCode(getStarterCode(project, firstStep, defaultSelections));
    setSelectedThemeId(project.defaultThemeId ?? "");
    setSelectedImageId(getStarterImageId(project, getStarterCode(project, firstStep, defaultSelections)));
    setManualChecksByStep({});
    setCheckpointAnswersByStep({});
    setCheckpointSubmittedByStep({});
    setReflectionResponses({});
    setStepStartCodeByStep({
      [firstStep.id]: getStarterCode(project, firstStep, defaultSelections),
    });
    setGateMessage(null);
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

  const clampEditorWidth = (nextWidth: number) => {
    const workspaceWidth = workspaceRef.current?.getBoundingClientRect().width ?? 0;

    if (!workspaceWidth) {
      return Math.max(40, Math.min(65, nextWidth));
    }

    const minWidthPercentage = (MIN_PANE_WIDTH / workspaceWidth) * 100;
    const minimum = Math.max(40, minWidthPercentage);
    const maximum = Math.min(65, 100 - minWidthPercentage);

    return Math.max(minimum, Math.min(maximum, nextWidth));
  };

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
  }, [isResizing]);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactViewport(window.innerWidth <= 1120);
      setEditorWidth((currentWidth) => clampEditorWidth(currentWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const selectImage = (imageId: string) => {
    const image = project.imageOptions?.find((item) => item.id === imageId);

    setSelectedImageId(imageId);

    if (!image || !project.onSelectImage) {
      return;
    }

    setCode((currentCode) => project.onSelectImage?.(currentCode, image) ?? currentCode);
  };

  const updateBuilderSelection = (questionId: string, optionId: string) => {
    setBuilderSelections((currentSelections) => {
      const nextSelections = {
        ...currentSelections,
        [questionId]: optionId,
      };

      if (step.showBuilder) {
        const nextStarterCode = getStarterCode(project, step, nextSelections);
        setCode(nextStarterCode);
        setSelectedImageId(getStarterImageId(project, nextStarterCode));
      }

      return nextSelections;
    });
  };

  const updateCheckpointAnswer = (questionId: string, optionIndex: number) => {
    setGateMessage(null);

    setCheckpointAnswersByStep((current) => ({
      ...current,
      [step.id]: {
        ...(current[step.id] ?? {}),
        [questionId]: optionIndex,
      },
    }));
    setCheckpointSubmittedByStep((current) => ({
      ...current,
      [step.id]: false,
    }));
  };

  const submitCheckpoint = () => {
    setCheckpointSubmittedByStep((current) => ({
      ...current,
      [step.id]: true,
    }));
  };

  const runManualCheck = () => {
    setManualChecksByStep((current) => ({
      ...current,
      [step.id]: true,
    }));
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

  if (isComplete) {
    return (
      <AppShell>
        <FinishScreen
          srcDoc={previewDoc}
          onRestart={restart}
          content={project.finish}
          notebookEntry={notebookReflection?.entry}
          notebookPrompt={notebookReflection?.prompt}
          sandbox={project.previewSandbox}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="lesson-shell">
        <LessonSidebar steps={project.steps} currentStep={currentStep} meta={project.sidebar} />

        <section className="lesson-workspace-shell">
          <div className="lesson-workspace-toolbar">
            <div className="pill-row">
              <span className="pill">Workspace</span>
              <span className="pill">Drag to resize</span>
              <span className="pill">Hide either pane</span>
            </div>
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

          <div
            ref={workspaceRef}
            className={`lesson-workspace pane-mode-${paneMode}`}
            style={workspaceColumns ? { gridTemplateColumns: workspaceColumns } : undefined}
          >
            {paneMode !== "preview-only" ? (
              <main className="lesson-main lesson-editor-pane">
                <StepPanel step={step} />

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
                  <StepActivityPanel activity={step.activity} />
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
                      onSelect={setSelectedThemeId}
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
                    onReflectionChange={(value) =>
                      setReflectionResponses((current) => ({
                        ...current,
                        [step.id]: value,
                      }))
                    }
                  />
                ) : gateMessage ? (
                  <section className="feedback-panel feedback-notYet">
                    <p className="feedback-gate-note">{gateMessage}</p>
                  </section>
                ) : null}

                <div className="lesson-footer">
                  {currentStep === 0 ? (
                    <Link href="/projects" className="button-ghost">
                      Back to projects
                    </Link>
                  ) : (
                    <button type="button" className="button-ghost" onClick={goBack}>
                      Back
                    </button>
                  )}

                  <button type="button" className="button" onClick={goNext}>
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
    </AppShell>
  );
}
