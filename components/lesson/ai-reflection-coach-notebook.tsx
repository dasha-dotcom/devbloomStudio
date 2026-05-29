"use client";

import { useMemo, useState } from "react";

import type { FeedbackState } from "@/lib/lesson-feedback";
import type { ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import { evaluateReflectionForCoach } from "@/lib/reflection-coach/evaluate-reflection";
import type {
  ReflectionCoachEvaluation,
  ReflectionCoachResult,
} from "@/lib/reflection-coach/types";
import type { LessonStep } from "@/lib/projects";

type AiReflectionCoachNotebookProps = {
  step: LessonStep;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
  onCoachCheck?: (check: ReflectionCoachCheck) => void;
};

const getFeedbackStateForCoachResult = (result: ReflectionCoachResult): FeedbackState =>
  result === "strong" ? "pass" : "notYet";

const getReflectionCoachMessage = (evaluation: ReflectionCoachEvaluation) => {
  if (evaluation.coachResult === "empty") {
    return "Write your own reflection first, then ask Sprout for one quick check.";
  }

  if (evaluation.coachResult === "weak") {
    return "Nice start — let's help your reflection grow with one more detail.";
  }

  return evaluation.positiveMessage ?? "Nice start — you named a specific part of your project.";
};

export function AiReflectionCoachNotebook({
  step,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
  onCoachCheck,
}: AiReflectionCoachNotebookProps) {
  const [hasAskedSprout, setHasAskedSprout] = useState(false);
  const coachEvaluation = useMemo(
    () =>
      evaluateReflectionForCoach({
        reflectionText: value,
        reflectionPrompt: step.reflectionPrompt,
      }),
    [step.reflectionPrompt, value],
  );
  const coachReview = hasAskedSprout
    ? {
        coachResult: coachEvaluation.coachResult,
        message: getReflectionCoachMessage(coachEvaluation),
        followUpQuestion: coachEvaluation.followUpQuestion,
      }
    : null;
  const trimmedValue = value.trim();
  const primaryState = coachReview ? getFeedbackStateForCoachResult(coachReview.coachResult) : status;
  const primaryMessage = coachReview?.message ?? statusMessage;
  const followUpQuestion = coachReview?.followUpQuestion;
  const shouldShowSavedPreview =
    status === "pass" && showSavedPreview && trimmedValue.length > 0 && !followUpQuestion;

  return (
    <div className="developer-notebook ai-reflection-coach">
      <div className="developer-notebook-header ai-reflection-coach-header">
        <div className="ai-reflection-coach-sprout">
          <span className="ai-reflection-coach-avatar" aria-hidden="true">
            🌱
          </span>
          <div>
            <div className="prediction-kicker">Reflection coach</div>
            <strong className="prediction-question">Sprout</strong>
          </div>
        </div>
        <p className="muted developer-notebook-copy">
          Sprout gives one quick reflection check after you write your own idea first.
        </p>
      </div>

      <div className="developer-notebook-entry ai-reflection-coach-entry">
        <strong className="prediction-question">{step.reflectionPrompt ?? ""}</strong>
        <textarea
          className="reflection-input developer-notebook-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={step.reflectionPlaceholder ?? "Write one or two sentences."}
          rows={4}
        />
        {primaryMessage ? (
          <p className={`prediction-feedback developer-notebook-status status-${primaryState}`}>
            {primaryMessage}
          </p>
        ) : null}
        <div className="ai-reflection-coach-actions">
          <button
            type="button"
            className="button-ghost ai-reflection-coach-button"
            onClick={() => {
              const evaluation = evaluateReflectionForCoach({
                reflectionText: value,
                reflectionPrompt: step.reflectionPrompt,
              });

              setHasAskedSprout(true);
              onCoachCheck?.({
                checkedAt: new Date().toISOString(),
                reflectionText: value,
                coachResult: evaluation.coachResult,
                coachFollowUpQuestion: evaluation.followUpQuestion,
                lessonFocus: evaluation.lessonFocus,
              });
            }}
          >
            {hasAskedSprout ? "Check again" : "Ask Sprout"}
          </button>
          <p className="muted ai-reflection-coach-note">
            Start with your own words. Sprout only adds one quick follow-up.
          </p>
        </div>
      </div>

      {followUpQuestion ? (
        <div className="developer-notebook-preview ai-reflection-coach-follow-up">
          <div className="ai-reflection-coach-sprout">
            <span className="ai-reflection-coach-avatar" aria-hidden="true">
              🌱
            </span>
            <div>
              <div className="prediction-kicker">Sprout says</div>
              <strong className="prediction-question">One quick follow-up</strong>
            </div>
          </div>
          <p className="ai-reflection-coach-follow-up-bubble">
            {followUpQuestion}
          </p>
        </div>
      ) : null}

      {shouldShowSavedPreview ? (
        <div className="developer-notebook-preview">
          <div className="prediction-kicker">Saved notebook entry</div>
          <p className="developer-notebook-preview-body">{trimmedValue}</p>
        </div>
      ) : null}
    </div>
  );
}
