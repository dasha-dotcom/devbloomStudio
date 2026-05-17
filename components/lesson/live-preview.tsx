"use client";

import type { ReactNode } from "react";

type LivePreviewProps = {
  srcDoc: string;
  title?: string;
  label?: string;
  description?: string;
  actions?: ReactNode;
  sandbox?: string;
};

export function LivePreview({
  srcDoc,
  title = "Live preview",
  label = "Live preview",
  description = "Your page updates as you type.",
  actions,
  sandbox = "allow-same-origin",
}: LivePreviewProps) {
  return (
    <div className="lesson-preview-card" data-tour-id="lesson-preview">
      <div className="preview-label">
        <div>
          <strong>{label}</strong>
          <p className="muted">{description}</p>
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
