"use client";

import { useState } from "react";

import type { LessonStep } from "@/lib/projects";

type PredictionCardProps = {
  prediction: NonNullable<LessonStep["prediction"]>;
};

export function PredictionCard({ prediction }: PredictionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const feedback =
    selectedIndex === null
      ? null
      : selectedIndex === prediction.answerIndex
        ? prediction.positiveFeedback ?? "Nice guess — now try it and see."
        : prediction.neutralFeedback ?? "Try it and see what changes in the preview.";

  return (
    <div className="prediction-card">
      <div className="prediction-kicker">Quick predict</div>
      <strong className="prediction-question">{prediction.question}</strong>
      <div className="prediction-options" role="group" aria-label={prediction.question}>
        {prediction.options.map((option, index) => {
          const isSelected = selectedIndex === index;

          return (
            <button
              key={option}
              type="button"
              className={`prediction-option ${isSelected ? "active" : ""}`}
              onClick={() => setSelectedIndex(index)}
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
