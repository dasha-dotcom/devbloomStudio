"use client";

import type { LessonCheckpointConfig } from "@/lib/projects";

type CheckpointPanelProps = {
  checkpoint: LessonCheckpointConfig;
  answers: Record<string, number>;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onSubmit: () => void;
  submitted: boolean;
};

export function CheckpointPanel({
  checkpoint,
  answers,
  onAnswer,
  onSubmit,
  submitted,
}: CheckpointPanelProps) {
  const answeredCount = checkpoint.questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;

  return (
    <section className="activity-panel">
      <div className="activity-topbar">
        <div>
          <div className="prediction-kicker">Checkpoint</div>
          <strong className="prediction-question">{checkpoint.title}</strong>
          <p className="muted activity-copy">{checkpoint.body}</p>
        </div>
        <span className="activity-progress">
          {answeredCount}/{checkpoint.questions.length} answered
        </span>
      </div>

      <div className="activity-question-stack">
        {checkpoint.questions.map((question) => {
          const selectedIndex = answers[question.id];

          return (
            <div key={question.id} className="activity-question-card">
              <strong className="activity-question-title">{question.prompt}</strong>

              <div className="activity-stack" style={{ marginTop: 14 }}>
                {question.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const isCorrect = question.correctOptionIndex === index;
                  const checkpointChoiceClassName = [
                    "match-card",
                    "choice-card",
                    "checkpoint-choice-card",
                    isSelected ? "selected" : "",
                    submitted && isSelected && isCorrect ? "checkpoint-choice-correct" : "",
                    submitted && isSelected && !isCorrect ? "checkpoint-choice-incorrect" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={option}
                      type="button"
                      className={checkpointChoiceClassName}
                      onClick={() => onAnswer(question.id, index)}
                      aria-pressed={isSelected}
                    >
                      <strong>{option}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="checkpoint-actions">
        <button
          type="button"
          className={`button checkpoint-submit-button${submitted ? " is-submitted" : ""}`}
          onClick={onSubmit}
        >
          {checkpoint.submitLabel ?? (submitted ? "Check again" : "Check my answers")}
        </button>
      </div>
    </section>
  );
}
