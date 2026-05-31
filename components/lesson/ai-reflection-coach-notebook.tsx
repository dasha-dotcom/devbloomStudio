"use client";

import { useState } from "react";

import type { FeedbackState } from "@/lib/lesson-feedback";
import type { ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import {
  evaluateReflectionForCoach,
  getReflectionCoachLessonFocus,
} from "@/lib/reflection-coach/evaluate-reflection";
import type {
  ReflectionCoachApiResponse,
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
  ReflectionCoachSource,
} from "@/lib/reflection-coach/types";
import type { LessonStep } from "@/lib/projects";

type AiReflectionCoachNotebookProps = {
  projectSlug: string;
  step: LessonStep;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
  onCoachCheck?: (check: ReflectionCoachCheck) => void;
};

type CoachReview = {
  coachResult: ReflectionCoachResult;
  message: string;
  followUpQuestion?: string;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isReflectionCoachResult = (value: unknown): value is ReflectionCoachResult =>
  value === "empty" || value === "weak" || value === "strong";

const isReflectionCoachFocus = (value: unknown): value is ReflectionCoachFocus =>
  value === "html" || value === "css" || value === "javascript" || value === "general";

const isReflectionCoachRecommendedFocus = (
  value: unknown,
): value is ReflectionCoachRecommendedFocus =>
  value === "specificity" ||
  value === "causality" ||
  value === "concept_connection" ||
  value === "ownership";

const isReflectionCoachSource = (value: unknown): value is ReflectionCoachSource =>
  value === "ai" || value === "local_fallback";

const isDetectedSignals = (value: unknown): value is ReflectionCoachDetectedSignals =>
  isRecord(value) &&
  typeof value.hasSpecificEdit === "boolean" &&
  typeof value.hasPageDetail === "boolean" &&
  typeof value.hasActionOrChange === "boolean" &&
  typeof value.hasConceptConnection === "boolean" &&
  typeof value.hasReasonOrChoice === "boolean";

const normalizeCoachApiResponse = (
  value: unknown,
): ReflectionCoachApiResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isReflectionCoachResult(value.coachResult) ||
    !isReflectionCoachRecommendedFocus(value.recommendedFocus) ||
    !isReflectionCoachFocus(value.lessonFocus) ||
    !isDetectedSignals(value.detectedSignals) ||
    !isReflectionCoachSource(value.source)
  ) {
    return null;
  }

  return {
    coachResult: value.coachResult,
    detectedSignals: value.detectedSignals,
    recommendedFocus: value.recommendedFocus,
    lessonFocus: value.lessonFocus,
    followUpQuestion:
      typeof value.followUpQuestion === "string" ? value.followUpQuestion : undefined,
    positiveMessage:
      typeof value.positiveMessage === "string" ? value.positiveMessage : undefined,
    source: value.source,
  } satisfies ReflectionCoachApiResponse;
};

const getCoachEvaluationFromApi = async ({
  projectSlug,
  step,
  reflectionText,
  localEvaluation,
}: {
  projectSlug: string;
  step: LessonStep;
  reflectionText: string;
  localEvaluation: ReflectionCoachEvaluation;
}): Promise<ReflectionCoachApiResponse | null> => {
  try {
    const response = await fetch("/api/reflection-coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectSlug,
        lessonTitle: step.title,
        reflectionPrompt: step.reflectionPrompt,
        lessonFocus: localEvaluation.lessonFocus,
        reflectionText,
        localEvaluation,
        variant: "ai_coach",
      }),
    });

    if (!response.ok) {
      return null;
    }

    return normalizeCoachApiResponse(await response.json());
  } catch {
    return null;
  }
};

export function AiReflectionCoachNotebook({
  projectSlug,
  step,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
  onCoachCheck,
}: AiReflectionCoachNotebookProps) {
  const [hasAskedSprout, setHasAskedSprout] = useState(false);
  const [isCheckingSprout, setIsCheckingSprout] = useState(false);
  const [coachReview, setCoachReview] = useState<CoachReview | null>(null);
  const trimmedValue = value.trim();
  const primaryState = coachReview ? getFeedbackStateForCoachResult(coachReview.coachResult) : status;
  const primaryMessage = coachReview?.message ?? statusMessage;
  const sproutPositiveMessage = coachReview?.coachResult === "strong" ? coachReview.message : null;
  const inlineStatusMessage = sproutPositiveMessage ? null : primaryMessage;
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
        {inlineStatusMessage ? (
          <p className={`prediction-feedback developer-notebook-status status-${primaryState}`}>
            {inlineStatusMessage}
          </p>
        ) : null}
        <div className="ai-reflection-coach-actions">
          <button
            type="button"
            className="button-ghost ai-reflection-coach-button"
            disabled={isCheckingSprout}
            onClick={async () => {
              if (isCheckingSprout) {
                return;
              }

              const reflectionText = value;
              const localEvaluation = evaluateReflectionForCoach({
                reflectionText,
                projectSlug,
                reflectionPrompt: step.reflectionPrompt,
                lessonFocus: getReflectionCoachLessonFocus(step.reflectionPrompt),
              });
              const localFallbackEvaluation = {
                ...localEvaluation,
                source: "local_fallback" as const,
              } satisfies ReflectionCoachApiResponse;

              setIsCheckingSprout(true);

              try {
                const apiEvaluation =
                  localEvaluation.coachResult === "empty"
                    ? null
                    : await getCoachEvaluationFromApi({
                        projectSlug,
                        step,
                        reflectionText,
                        localEvaluation,
                      });
                const displayedEvaluation = apiEvaluation ?? localFallbackEvaluation;

                setHasAskedSprout(true);
                setCoachReview({
                  coachResult: displayedEvaluation.coachResult,
                  message: getReflectionCoachMessage(displayedEvaluation),
                  followUpQuestion: displayedEvaluation.followUpQuestion,
                });
                onCoachCheck?.({
                  checkedAt: new Date().toISOString(),
                  reflectionText,
                  coachResult: displayedEvaluation.coachResult,
                  coachFollowUpQuestion: displayedEvaluation.followUpQuestion,
                  lessonFocus: displayedEvaluation.lessonFocus,
                  source: displayedEvaluation.source,
                });
              } finally {
                setIsCheckingSprout(false);
              }
            }}
          >
            {isCheckingSprout ? "Checking..." : hasAskedSprout ? "Check again" : "Ask Sprout"}
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

      {sproutPositiveMessage ? (
        <div className="developer-notebook-preview ai-reflection-coach-follow-up">
          <div className="ai-reflection-coach-sprout">
            <span className="ai-reflection-coach-avatar" aria-hidden="true">
              🌱
            </span>
            <div>
              <div className="prediction-kicker">Sprout says</div>
              <strong className="prediction-question">Nice reflection</strong>
            </div>
          </div>
          <p className="ai-reflection-coach-follow-up-bubble">
            {sproutPositiveMessage}
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
