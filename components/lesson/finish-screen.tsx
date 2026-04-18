import Link from "next/link";

import type { FinishScreenContent } from "@/lib/projects";

type FinishScreenProps = {
  srcDoc: string;
  onRestart: () => void;
  content: FinishScreenContent;
  sandbox?: string;
};

export function FinishScreen({
  srcDoc,
  onRestart,
  content,
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
