import type { FeedbackState } from "@/lib/lesson-feedback";

type DeveloperNotebookProps = {
  prompt: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
};

export function DeveloperNotebook({
  prompt,
  placeholder,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
}: DeveloperNotebookProps) {
  const trimmedValue = value.trim();
  const shouldShowSavedPreview = status === "pass" && showSavedPreview && trimmedValue.length > 0;

  return (
    <div className="developer-notebook">
      <div className="developer-notebook-header">
        <div className="prediction-kicker">Project note</div>
        <strong className="prediction-question">Developer Notebook</strong>
        <p className="muted developer-notebook-copy">
          Developers use notes to track what they changed, explain why they made those choices, and plan how to make the next version even better.
        </p>
      </div>

      <div className="developer-notebook-entry">
        <strong className="prediction-question">{prompt}</strong>
        <textarea
          className="reflection-input developer-notebook-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? "Write one or two sentences."}
          rows={4}
        />
        {statusMessage ? (
          <p className={`prediction-feedback developer-notebook-status status-${status}`}>
            {statusMessage}
          </p>
        ) : null}
      </div>

      {shouldShowSavedPreview ? (
        <div className="developer-notebook-preview">
          <div className="prediction-kicker">Saved notebook entry</div>
          <p className="developer-notebook-preview-body">{trimmedValue}</p>
        </div>
      ) : null}
    </div>
  );
}
