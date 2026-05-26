"use client";

import { useMemo, useState } from "react";

import type { FeedbackState } from "@/lib/lesson-feedback";
import type { LessonStep } from "@/lib/projects";

type AiReflectionCoachNotebookProps = {
  step: LessonStep;
  value: string;
  onChange: (value: string) => void;
  status: FeedbackState;
  statusMessage?: string;
  showSavedPreview?: boolean;
};

type ReflectionCoachFocus = "html" | "css" | "javascript" | "general";

type ReflectionCoachReview = {
  state: FeedbackState;
  message: string;
  followUpQuestion?: string;
};

const followUpQuestionByFocus: Record<ReflectionCoachFocus, string> = {
  html: "What part of the page did HTML control?",
  css: "What style changed on the page?",
  javascript: "What made the page react?",
  general: "What specific part of your project changed?",
};

const getReflectionCoachFocus = (step: LessonStep): ReflectionCoachFocus => {
  const prompt = step.reflectionPrompt?.toLowerCase() ?? "";
  const mentionsHtml = prompt.includes("html");
  const mentionsCss = prompt.includes("css");
  const mentionsJavascript = prompt.includes("javascript");

  if (mentionsHtml && !mentionsCss && !mentionsJavascript) {
    return "html";
  }

  if (mentionsCss && !mentionsHtml && !mentionsJavascript) {
    return "css";
  }

  if (mentionsJavascript && !mentionsHtml && !mentionsCss) {
    return "javascript";
  }

  return "general";
};

const hasWeakReflection = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return true;
  }

  const wordCount = trimmedValue.split(/\s+/).filter(Boolean).length;
  const nonSpaceCharacterCount = trimmedValue.replace(/\s/g, "").length;
  const normalizedValue = trimmedValue.toLowerCase();
  const hasConcreteDetail = /(title|intro|paragraph|list|image|page|button|emoji|background|color|card|text|theme|mood|style|class|selector|rule|event|click|html|css|javascript|js)/.test(
    normalizedValue,
  );
  const hasActionWord = /(changed|added|made|updated|styled|used|clicked|switched|customized|wrote|picked|set)/.test(
    normalizedValue,
  );

  return wordCount < 5 || nonSpaceCharacterCount < 20 || (!hasConcreteDetail && !hasActionWord);
};

const getReflectionCoachReview = (
  value: string,
  focus: ReflectionCoachFocus,
): ReflectionCoachReview => {
  if (!value.trim()) {
    return {
      state: "notYet",
      message: "Write your own reflection first, then ask Sprout for one quick check.",
    };
  }

  if (hasWeakReflection(value)) {
    return {
      state: "notYet",
      message: "Nice start — let's help your reflection grow with one more detail.",
      followUpQuestion: followUpQuestionByFocus[focus],
    };
  }

  const positiveMessageByFocus: Record<ReflectionCoachFocus, string> = {
    html: "Nice start — you named a real part of the page that HTML controlled.",
    css: "Nice start — you explained a style change on the page.",
    javascript: "Nice start — you described what made the page react.",
    general: "Nice start — you named a specific part of your project.",
  };

  return {
    state: "pass",
    message: positiveMessageByFocus[focus],
  };
};

export function AiReflectionCoachNotebook({
  step,
  value,
  onChange,
  status,
  statusMessage,
  showSavedPreview = false,
}: AiReflectionCoachNotebookProps) {
  const [hasAskedSprout, setHasAskedSprout] = useState(false);
  const focus = useMemo(() => getReflectionCoachFocus(step), [step]);
  const coachReview = hasAskedSprout ? getReflectionCoachReview(value, focus) : null;
  const trimmedValue = value.trim();
  const primaryState = coachReview?.state ?? status;
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
            onClick={() => setHasAskedSprout(true)}
            disabled={trimmedValue.length === 0}
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
