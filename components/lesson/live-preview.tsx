"use client";

import type { ReactNode } from "react";

type LivePreviewProps = {
  srcDoc: string;
  title?: string;
  actions?: ReactNode;
  sandbox?: string;
};

export function LivePreview({
  srcDoc,
  title = "Live preview",
  actions,
  sandbox = "allow-same-origin",
}: LivePreviewProps) {
  return (
    <div className="lesson-preview-card" data-tour-id="lesson-preview">
      <div className="preview-label">
        <div>
          <strong>Live preview</strong>
          <p className="muted">Your page updates as you type.</p>
        </div>
        <div className="preview-meta">
          <span className="preview-badge">{title}</span>
          {actions ? <div className="pane-actions">{actions}</div> : null}
        </div>
      </div>
      <iframe
        className="preview-frame"
        srcDoc={srcDoc}
        sandbox={sandbox}
        title={title}
      />
    </div>
  );
}
