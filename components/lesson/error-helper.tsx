"use client";

import { useState } from "react";

import type { ActiveEditorError } from "@/lib/editor-errors/types";

type ErrorHelperProps = {
  error: ActiveEditorError;
  onShowWhere: () => void;
};

export function ErrorHelper({ error, onShowWhere }: ErrorHelperProps) {
  const [isHintOpen, setIsHintOpen] = useState(false);

  return (
    <section className="error-helper-card" aria-live="polite">
      <div className="error-helper-copy">
        <span className="error-helper-eyebrow">Error helper</span>
        <strong className="error-helper-title">{error.title}</strong>
        <p className="error-helper-body">{error.body}</p>
      </div>

      <div className="error-helper-actions">
        <button
          type="button"
          className="button-ghost error-helper-button"
          onClick={onShowWhere}
          disabled={!error.lineNumber}
        >
          Show me where
        </button>
        <button
          type="button"
          className="button-ghost error-helper-button"
          onClick={() => setIsHintOpen((current) => !current)}
          aria-expanded={isHintOpen}
        >
          Give me a hint
        </button>
      </div>

      {isHintOpen ? <p className="error-helper-hint">{error.hint}</p> : null}
    </section>
  );
}
