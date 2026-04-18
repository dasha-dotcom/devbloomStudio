"use client";

import { useState } from "react";

import type { LessonStep } from "@/lib/projects";

type SelectionActivity = Extract<NonNullable<LessonStep["activity"]>, { type: "selection" }>;

type StepActivityPanelProps = {
  activity: SelectionActivity;
};

export function StepActivityPanel({ activity }: StepActivityPanelProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const completedCount = Object.keys(selectedAnswers).length;
  const totalQuestions = activity.questions.length;
  const isComplete = completedCount === totalQuestions;

  return (
    <section className="activity-panel">
      <div className="activity-topbar">
        <div>
          <div className="prediction-kicker">Match It</div>
          <strong className="prediction-question">{activity.title}</strong>
          <p className="muted activity-copy">{activity.body}</p>
        </div>
        <span className="activity-progress">
          {completedCount}/{totalQuestions} answered
        </span>
      </div>

      <div className="activity-question-stack">
        {activity.questions.map((question) => {
          const selectedIndex = selectedAnswers[question.id];
          const feedback =
            selectedIndex === undefined
              ? null
              : selectedIndex === question.answerIndex
                ? question.positiveFeedback ?? "Nice choice. Test it in the preview."
                : question.neutralFeedback ?? "Try the preview and compare what really happens.";

          return (
            <div key={question.id} className="activity-question-card">
              <strong className="activity-question-title">{question.title}</strong>

              <div className="activity-stack" style={{ marginTop: 14 }}>
                {question.options.map((option, index) => {
                  const isSelected = selectedIndex === index;

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`match-card choice-card${isSelected ? " selected" : ""}`}
                      onClick={() =>
                        setSelectedAnswers((current) => ({
                          ...current,
                          [question.id]: index,
                        }))
                      }
                    >
                      <strong>{option}</strong>
                    </button>
                  );
                })}
              </div>

              {feedback ? <p className="activity-question-feedback">{feedback}</p> : null}
            </div>
          );
        })}
      </div>

      <div className={`activity-footer${isComplete ? " complete" : ""}`}>
        <p>
          {isComplete
            ? "Nice work. Now test the button and connect your answers to what you see on the page."
            : "Answer both questions, then test the preview to check your thinking."}
        </p>
      </div>
    </section>
  );
}
