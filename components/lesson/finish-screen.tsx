import Link from "next/link";

import { DeveloperProgressRing } from "@/components/lesson/developer-progress-ring";
import type { FinishScreenContent } from "@/lib/projects";

type FinishScreenProps = {
  srcDoc: string;
  onContinueEditing: () => void;
  onStartOver: () => void;
  onSaveAndExit?: () => Promise<void> | void;
  content: FinishScreenContent;
  progressPercent: number;
  notebookEntry?: string;
  notebookPrompt?: string;
  sandbox?: string;
  projectsHref?: string;
  showSaveAndExit?: boolean;
  saveAndExitState?: "idle" | "saving" | "saved" | "error";
};

export function FinishScreen({
  srcDoc,
  onContinueEditing,
  onStartOver,
  onSaveAndExit,
  content,
  progressPercent,
  notebookEntry,
  notebookPrompt,
  sandbox = "allow-same-origin",
  projectsHref = "/projects",
  showSaveAndExit = false,
  saveAndExitState = "idle",
}: FinishScreenProps) {
  return (
    <div className="finish-wrap">
      <div className="finish-card">
        <span className="eyebrow">{content.eyebrow}</span>
        <h1 className="finish-title">{content.title}</h1>
        <p className="muted">{content.body}</p>
        <div className="finish-actions">
          <div className="pill-row">
            {content.learnedBadges.map((badge) => (
              <span key={badge} className="pill">
                {badge}
              </span>
            ))}
          </div>
        </div>
        <section className="finish-process-card">
          <div className="finish-process-copy">
            <div className="prediction-kicker">Developer Process</div>
            <strong className="prediction-question">{progressPercent}% complete</strong>
            <p className="muted finish-process-body">
              This shows how much of the developer work you completed — coding, predicting, and reflecting on your choices.
            </p>
          </div>
          <DeveloperProgressRing percent={progressPercent} label="Developer Process" />
        </section>
        {notebookEntry ? (
          <section className="finish-notebook-card">
            <div className="prediction-kicker">Project story</div>
            <strong className="prediction-question">Your Developer Notebook Entry</strong>
            <p className="muted finish-notebook-copy">
              This note is part of your project story. It helps you explain your work like a
              developer.
            </p>
            {notebookPrompt ? (
              <p className="finish-notebook-prompt">
                <strong>Prompt:</strong> {notebookPrompt}
              </p>
            ) : null}
            <p className="finish-notebook-entry">{notebookEntry}</p>
          </section>
        ) : null}
        <div className="finish-preview">
          <iframe
            srcDoc={srcDoc}
            sandbox={sandbox}
            title="Final project preview"
          />
        </div>
        <div className="hero-actions">
          {showSaveAndExit ? (
            <button
              type="button"
              className={`button finish-save-exit-button finish-save-exit-${saveAndExitState}`}
              onClick={() => {
                if (onSaveAndExit) {
                  void onSaveAndExit();
                }
              }}
              disabled={saveAndExitState === "saving"}
            >
              {saveAndExitState === "saving"
                ? "Saving..."
                : saveAndExitState === "saved"
                  ? "Saved. Safe to exit"
                  : saveAndExitState === "error"
                    ? "Save error. Try again"
                    : "Save and exit"}
            </button>
          ) : null}
          <button type="button" className="button" onClick={onContinueEditing}>
            Continue editing
          </button>
          <button type="button" className="button-ghost" onClick={onStartOver}>
            Start over
          </button>
          <Link href={projectsHref} className="button-ghost">
            Back to projects
          </Link>
        </div>
        {showSaveAndExit ? (
          <p
            className={`finish-save-exit-note finish-save-exit-note-${saveAndExitState}`}
            aria-live="polite"
          >
            {saveAndExitState === "saving"
              ? "Saving your finished project now."
              : saveAndExitState === "saved"
                ? "Your work is saved. You can safely close this tab or leave this page."
                : saveAndExitState === "error"
                  ? "We could not confirm the save yet. Try the button again before exiting."
                  : "Use this before closing the tab if you want a clear saved signal."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
