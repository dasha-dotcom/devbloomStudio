"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CodeEditor } from "@/components/lesson/code-editor";
import { FinishScreen } from "@/components/lesson/finish-screen";
import { ImagePicker } from "@/components/lesson/image-picker";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LivePreview } from "@/components/lesson/live-preview";
import { ProjectBuilderPanel } from "@/components/lesson/project-builder-panel";
import { StepPanel } from "@/components/lesson/step-panel";
import { StepActivityPanel } from "@/components/lesson/step-activity-panel";
import { ThemePicker } from "@/components/lesson/theme-picker";
import {
  getDefaultBuilderSelections,
  getStarterCode,
  getStarterImageId,
  type LessonProjectConfig,
} from "@/lib/projects";

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
  const [builderSelections, setBuilderSelections] = useState(() => getDefaultBuilderSelections(project));
  const [activeEditorTabId, setActiveEditorTabId] = useState(() => firstStep.defaultEditorTabId ?? firstStep.editorTabs?.[0]?.id ?? "default");
  const [code, setCode] = useState(() => getStarterCode(project, firstStep, getDefaultBuilderSelections(project)));
  const [selectedThemeId, setSelectedThemeId] = useState(project.defaultThemeId ?? "");
  const [selectedImageId, setSelectedImageId] = useState(() =>
    getStarterImageId(project, getStarterCode(project, firstStep, getDefaultBuilderSelections(project))),
  );
  const [paneMode, setPaneMode] = useState<PaneMode>("both");
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ pointerX: 0, editorWidth: DEFAULT_EDITOR_WIDTH });

  const step = project.steps[currentStep];
  const starterCode = useMemo(
    () => getStarterCode(project, step, builderSelections),
    [builderSelections, project, step],
  );
  const isResetDisabled = code === starterCode;
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

  const goNext = () => setCurrentStep((value) => Math.min(value + 1, lastLessonIndex));
  const goBack = () => setCurrentStep((value) => Math.max(value - 1, 0));
  const resetCode = () => {
    setCode(starterCode);
    setSelectedImageId(getStarterImageId(project, starterCode));
  };
  const restart = () => {
    const defaultSelections = getDefaultBuilderSelections(project);
    setCurrentStep(0);
    setBuilderSelections(defaultSelections);
    setActiveEditorTabId(firstStep.defaultEditorTabId ?? firstStep.editorTabs?.[0]?.id ?? "default");
    setCode(getStarterCode(project, firstStep, defaultSelections));
    setSelectedThemeId(project.defaultThemeId ?? "");
    setSelectedImageId(getStarterImageId(project, getStarterCode(project, firstStep, defaultSelections)));
  };

  const updateEditorCode = (nextValue: string) => {
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

  useEffect(() => {
    setActiveEditorTabId(step.defaultEditorTabId ?? step.editorTabs?.[0]?.id ?? "default");
  }, [step]);

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

  if (currentStep === lastLessonIndex) {
    return (
      <AppShell>
        <FinishScreen
          srcDoc={previewDoc}
          onRestart={restart}
          content={project.finish}
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
                            onClick={() => setActiveEditorTabId(tab.id)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <CodeEditor
                      value={editorCode}
                      onChange={updateEditorCode}
                      focus={step.editorFocus}
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
                            Reset
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
                  </>
                ) : (
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
                )}

                {step.activity ? <StepActivityPanel activity={step.activity} /> : null}

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
                    {currentStep === lastLessonIndex - 1 ? "Finish project" : "Next step"}
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
