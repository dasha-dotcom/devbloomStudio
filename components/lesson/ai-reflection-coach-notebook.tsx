"use client";

import { useState } from "react";

import type { FeedbackState } from "@/lib/lesson-feedback";
import type { ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import {
  evaluateReflectionForCoach,
  getReflectionCoachLessonFocus,
} from "@/lib/reflection-coach/evaluate-reflection";
import { applyLocalMisconceptionOverlay } from "@/lib/reflection-coach/misconception-detection";
import type {
  ReflectionCoachAiAnalysis,
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
  reflectionGateMessage?: string | null;
  reflectionGateState?: FeedbackState | null;
  priorAiCheckCount?: number;
  onCoachCheck?: (check: ReflectionCoachCheck) => void;
};

type CoachReview = {
  coachResult: ReflectionCoachResult;
  message: string;
  followUpQuestion?: string;
};

const getFeedbackStateForCoachResult = (result: ReflectionCoachResult): FeedbackState =>
  result === "strong" ? "pass" : result === "almost_there" ? "close" : "notYet";

const getReflectionCoachMessage = (evaluation: ReflectionCoachEvaluation) => {
  if (evaluation.coachResult === "empty") {
    return "Write your own reflection first, then ask Sprout for one quick check.";
  }

  if (evaluation.coachResult === "weak") {
    return "Nice start — let's help your reflection grow with one more detail.";
  }

  if (evaluation.coachResult === "almost_there") {
    return "Nice start — add one more detail so Sprout can understand your thinking.";
  }

  return evaluation.positiveMessage ?? "Nice start — you named a specific part of your project.";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isReflectionCoachResult = (value: unknown): value is ReflectionCoachResult =>
  value === "empty" || value === "weak" || value === "almost_there" || value === "strong";

const isReflectionCoachFocus = (value: unknown): value is ReflectionCoachFocus =>
  value === "html" || value === "css" || value === "javascript" || value === "general";

const isReflectionCoachRecommendedFocus = (
  value: unknown,
): value is ReflectionCoachRecommendedFocus =>
  value === "specificity" ||
  value === "causality" ||
  value === "concept_connection" ||
  value === "ownership" ||
  value === "make_it_yours";

const isReflectionCoachSource = (value: unknown): value is ReflectionCoachSource =>
  value === "ai" || value === "local_fallback";

const MAX_TEACHER_INSIGHT_LENGTH = 240;
const MAX_ANALYSIS_TEXT_LENGTH = 180;
const MAX_ANALYSIS_ARRAY_ITEMS = 4;
const MAX_ANALYSIS_ARRAY_ITEM_LENGTH = 80;

const unsafeStructuredTextPattern =
  /```|`[^`]+`|\*\*|__|^#{1,6}\s|\[[^\]]+\]\([^)]+\)|^\s*[-*]\s+|^\s*[[{]|["'][a-z0-9_-]+["']\s*:|\b(stack trace|traceback|error:|at\s+\S+\s+\(.+:\d+:\d+\))\b/i;
const unsafePlainTextPattern =
  /\b(incorrect|insufficient|wrong|bad|failed|failure|lazy|cheated|copied|chain of thought|hidden reasoning|step-by-step reasoning|thought process|internal reasoning)\b/i;

const isSafeOptionalText = (value: string, maxLength: number) =>
  value.length <= maxLength &&
  !value.includes("\n") &&
  !unsafeStructuredTextPattern.test(value) &&
  !unsafePlainTextPattern.test(value);

const isAiSpecificity = (
  value: unknown,
): value is ReflectionCoachAiAnalysis["specificity"] =>
  value === "empty" ||
  value === "generic" ||
  value === "somewhat_specific" ||
  value === "specific";

const isAiPersonalization = (
  value: unknown,
): value is ReflectionCoachAiAnalysis["personalization"] =>
  value === "none" ||
  value === "generic_example" ||
  value === "some_personal_detail" ||
  value === "clearly_personalized";

const isAiMisconceptionRisk = (
  value: unknown,
): value is ReflectionCoachAiAnalysis["misconceptionRisk"] =>
  value === "none" ||
  value === "html_css_confusion" ||
  value === "html_js_confusion" ||
  value === "css_js_confusion" ||
  value === "event_result_confusion" ||
  value === "other";

const isAiCopiedExampleRisk = (
  value: unknown,
): value is ReflectionCoachAiAnalysis["copiedExampleRisk"] =>
  value === "none" || value === "possible" || value === "likely";

const normalizeOptionalAnalysisText = (
  value: unknown,
  maxLength = MAX_ANALYSIS_TEXT_LENGTH,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return isSafeOptionalText(trimmed, maxLength) ? trimmed : null;
};

const normalizeOptionalAnalysisStringArray = (value: unknown): string[] | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length > MAX_ANALYSIS_ARRAY_ITEMS) {
    return null;
  }

  const normalizedItems: string[] = [];

  for (const item of value) {
    const normalizedItem = normalizeOptionalAnalysisText(item, MAX_ANALYSIS_ARRAY_ITEM_LENGTH);

    if (normalizedItem === null) {
      return null;
    }

    if (normalizedItem) {
      normalizedItems.push(normalizedItem);
    }
  }

  return normalizedItems;
};

const normalizeAiAnalysis = (value: unknown): ReflectionCoachAiAnalysis | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (
    !isRecord(value) ||
    !isAiSpecificity(value.specificity) ||
    !isAiPersonalization(value.personalization) ||
    !isAiMisconceptionRisk(value.misconceptionRisk) ||
    !isAiCopiedExampleRisk(value.copiedExampleRisk)
  ) {
    return null;
  }

  const misconceptionNote = normalizeOptionalAnalysisText(value.misconceptionNote);
  const inferredStudentUnderstanding = normalizeOptionalAnalysisStringArray(
    value.inferredStudentUnderstanding,
  );
  const missingConcepts = normalizeOptionalAnalysisStringArray(value.missingConcepts);

  if (
    misconceptionNote === null ||
    inferredStudentUnderstanding === null ||
    missingConcepts === null
  ) {
    return null;
  }

  return {
    specificity: value.specificity,
    personalization: value.personalization,
    misconceptionRisk: value.misconceptionRisk,
    ...(misconceptionNote ? { misconceptionNote } : {}),
    ...(inferredStudentUnderstanding ? { inferredStudentUnderstanding } : {}),
    ...(missingConcepts ? { missingConcepts } : {}),
    copiedExampleRisk: value.copiedExampleRisk,
  };
};

const normalizeDetectedSignals = (value: unknown): ReflectionCoachDetectedSignals | null => {
  if (
    !isRecord(value) ||
    typeof value.hasSpecificEdit !== "boolean" ||
    typeof value.hasPageDetail !== "boolean" ||
    typeof value.hasActionOrChange !== "boolean" ||
    typeof value.hasConceptConnection !== "boolean" ||
    typeof value.hasReasonOrChoice !== "boolean"
  ) {
    return null;
  }

  return {
    hasSpecificEdit: value.hasSpecificEdit,
    hasPageDetail: value.hasPageDetail,
    hasActionOrChange: value.hasActionOrChange,
    hasConceptConnection: value.hasConceptConnection,
    hasReasonOrChoice: value.hasReasonOrChoice,
    hasCopiedExample:
      typeof value.hasCopiedExample === "boolean" ? value.hasCopiedExample : false,
  };
};

export const normalizeCoachApiResponse = (
  value: unknown,
): ReflectionCoachApiResponse | null => {
  if (!isRecord(value)) {
    return null;
  }

  const detectedSignals = normalizeDetectedSignals(value.detectedSignals);
  const analysis = normalizeAiAnalysis(value.analysis);
  const teacherInsight = normalizeOptionalAnalysisText(
    value.teacherInsight,
    MAX_TEACHER_INSIGHT_LENGTH,
  );

  if (
    !isReflectionCoachResult(value.coachResult) ||
    !isReflectionCoachRecommendedFocus(value.recommendedFocus) ||
    !isReflectionCoachFocus(value.lessonFocus) ||
    !detectedSignals ||
    analysis === null ||
    teacherInsight === null ||
    !isReflectionCoachSource(value.source)
  ) {
    return null;
  }

  return {
    coachResult: value.coachResult,
    detectedSignals,
    recommendedFocus: value.recommendedFocus,
    lessonFocus: value.lessonFocus,
    followUpQuestion:
      typeof value.followUpQuestion === "string" ? value.followUpQuestion : undefined,
    positiveMessage:
      typeof value.positiveMessage === "string" ? value.positiveMessage : undefined,
    ...(analysis ? { analysis } : {}),
    ...(teacherInsight ? { teacherInsight } : {}),
    source: value.source,
  } satisfies ReflectionCoachApiResponse;
};

const getCoachEvaluationFromApi = async ({
  projectSlug,
  step,
  reflectionText,
  localEvaluation,
  priorAiCheckCount,
}: {
  projectSlug: string;
  step: LessonStep;
  reflectionText: string;
  localEvaluation: ReflectionCoachEvaluation;
  priorAiCheckCount: number;
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
        reflectionPlaceholder: step.reflectionPlaceholder,
        lessonFocus: localEvaluation.lessonFocus,
        reflectionText,
        localEvaluation,
        variant: "ai_coach",
        priorAiCheckCount,
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
  reflectionGateMessage,
  reflectionGateState,
  priorAiCheckCount = 0,
  onCoachCheck,
}: AiReflectionCoachNotebookProps) {
  const [hasAskedSprout, setHasAskedSprout] = useState(false);
  const [isCheckingSprout, setIsCheckingSprout] = useState(false);
  const [coachReview, setCoachReview] = useState<CoachReview | null>(null);
  const trimmedValue = value.trim();
  const primaryState = coachReview ? getFeedbackStateForCoachResult(coachReview.coachResult) : status;
  const primaryMessage = coachReview?.message ?? statusMessage;
  const displayState = reflectionGateState ?? primaryState;
  const displayMessage = reflectionGateMessage ?? primaryMessage;
  const sproutPositiveMessage = coachReview?.coachResult === "strong" ? coachReview.message : null;
  const inlineStatusMessage = sproutPositiveMessage ? null : displayMessage;
  const followUpQuestion = coachReview?.followUpQuestion;
  const shouldShowSavedPreview =
    displayState === "pass" && showSavedPreview && trimmedValue.length > 0 && !followUpQuestion;

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
          <p className={`prediction-feedback developer-notebook-status status-${displayState}`}>
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
                ...applyLocalMisconceptionOverlay({
                  evaluation: localEvaluation,
                  reflectionText,
                  projectSlug,
                }),
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
                        priorAiCheckCount,
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
