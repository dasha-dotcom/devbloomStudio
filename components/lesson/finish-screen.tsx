import Link from "next/link";

import type { FinishScreenContent } from "@/lib/projects";

type FinishScreenProps = {
  srcDoc: string;
  onRestart: () => void;
  content: FinishScreenContent;
  notebookEntry?: string;
  notebookPrompt?: string;
  sandbox?: string;
};

export function FinishScreen({
  srcDoc,
  onRestart,
  content,
  notebookEntry,
  notebookPrompt,
  sandbox = "allow-same-origin",
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
          <button type="button" className="button" onClick={onRestart}>
            Edit again
          </button>
          <Link href="/projects" className="button-ghost">
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}
