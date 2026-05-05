"use client";

import type { LessonStep } from "@/lib/projects";

type PredictionCardProps = {
  prediction: NonNullable<LessonStep["prediction"]>;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

export function PredictionCard({ prediction, selectedIndex, onSelect }: PredictionCardProps) {
  const isAnswered = selectedIndex !== null;

  const feedback =
    selectedIndex === null
      ? null
      : selectedIndex === prediction.answerIndex
        ? prediction.positiveFeedback ?? "Nice guess — now try it and see."
        : prediction.neutralFeedback ?? "Try it and see what changes in the preview.";

  return (
    <div className={`prediction-card ${isAnswered ? "answered" : "unanswered"}`}>
      <div className="prediction-topbar">
        <div>
          <div className="prediction-kicker">Pause and predict</div>
          <strong className="prediction-question">{prediction.question}</strong>
        </div>
        <div
          className="prediction-bulb"
          aria-hidden="true"
        >
          <span className="prediction-bulb-rays" />
          <span className="prediction-bulb-glow" />
          <span className="prediction-bulb-icon">💡</span>
        </div>
      </div>
      <p className="prediction-support-copy">
        {isAnswered
          ? "Idea unlocked. Now test your guess and see what the code actually does."
          : "Developers make a guess before testing code. Pick what you think will happen first."}
      </p>
      <div className="prediction-options" role="group" aria-label={prediction.question}>
        {prediction.options.map((option, index) => {
          const isSelected = selectedIndex === index;

          return (
            <button
              key={option}
              type="button"
              className={`prediction-option ${isSelected ? "active" : ""}`}
              onClick={() => onSelect(index)}
              aria-pressed={isSelected}
            >
              {option}
            </button>
          );
        })}
      </div>
      {feedback ? <p className="prediction-feedback">{feedback}</p> : null}
    </div>
  );
}
