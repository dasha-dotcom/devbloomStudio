import { getReflectionRubric } from "./rubrics/index";
import {
  getDetectedSignals,
  getRecommendedFocus,
} from "./signal-detection";
import type {
  ReflectionCoachEvaluation,
  ReflectionCoachEvaluationInput,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
} from "./types";

const positiveMessageByFocus: Record<ReflectionCoachFocus, string> = {
  html: "Nice start — you named a real part of the page that HTML controlled.",
  css: "Nice start — you explained a style change on the page.",
  javascript: "Nice start — you described what made the page react.",
  general: "Nice start — you named a specific part of your project.",
};

const mentionedDetailPatterns = [
  { pattern: /\b(heading|title)\b/, label: "the heading" },
  { pattern: /\b(button)\b/, label: "the button" },
  { pattern: /\b(image|picture|photo)\b/, label: "the image" },
  { pattern: /\b(background)\b/, label: "the background" },
  { pattern: /\b(color|colors)\b/, label: "the colors" },
  { pattern: /\b(list)\b/, label: "the list" },
  { pattern: /\b(paragraph|text|words)\b/, label: "the text" },
  { pattern: /\b(style|css)\b/, label: "the style" },
  { pattern: /\b(click|clicked|react|reacted)\b/, label: "the interaction" },
  { pattern: /\b(html)\b/, label: "HTML" },
  { pattern: /\b(javascript|js)\b/, label: "JavaScript" },
];

const followUpQuestionsByRecommendedFocus: Record<
  ReflectionCoachRecommendedFocus,
  Record<ReflectionCoachFocus, string[]>
> = {
  specificity: {
    html: ["What exact HTML part did you change?", "What page content did your HTML control?"],
    css: ["What exact style did you change?", "Which part of the page looked different?"],
    javascript: ["What exact interaction changed?", "What page action should Sprout notice?"],
    general: ["What exact part of your project changed?", "What detail on the page should Sprout notice?"],
  },
  causality: {
    html: ["What appeared on the page after that HTML change?", "What did that change make the page show?"],
    css: ["What looked different on the page after that change?", "How did that style change the page's mood?"],
    javascript: ["What happened on the page after the interaction?", "What made the page react?"],
    general: ["What happened on the page after that change?", "What did your change make the page show or do?"],
  },
  concept_connection: {
    html: ["How does that connect to HTML on your page?", "What did HTML control in that change?"],
    css: ["How does that connect to CSS or styling?", "What did CSS control in that change?"],
    javascript: ["How does that connect to JavaScript?", "What made the page react in that change?"],
    general: ["Which coding idea does that connect to?", "Was that change about content, style, or interaction?"],
  },
  ownership: {
    html: ["Why did you choose that content?", "What did you want that HTML change to show about you?"],
    css: ["Why did you choose that style?", "What feeling did you want that style to create?"],
    javascript: ["Why did you choose that interaction?", "What did you want the page to do for your visitor?"],
    general: ["Why did you choose that change?", "What goal did you have for that part of your project?"],
  },
};

export const getReflectionCoachLessonFocus = (
  reflectionPrompt?: string,
): ReflectionCoachFocus => {
  const prompt = reflectionPrompt?.toLowerCase() ?? "";
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

const getStableQuestionIndex = (value: string, count: number) => {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997;
  }

  return hash % count;
};

const getMentionedDetailComment = (normalizedValue: string) => {
  const detail = mentionedDetailPatterns.find((item) => item.pattern.test(normalizedValue));

  if (!detail) {
    return "You started with your idea.";
  }

  return `You mentioned ${detail.label}.`;
};

const getFollowUpQuestion = ({
  normalizedValue,
  recommendedFocus,
  lessonFocus,
}: {
  normalizedValue: string;
  recommendedFocus: ReflectionCoachRecommendedFocus;
  lessonFocus: ReflectionCoachFocus;
}) => {
  const questions = followUpQuestionsByRecommendedFocus[recommendedFocus][lessonFocus];
  const question =
    questions[getStableQuestionIndex(`${normalizedValue}:${recommendedFocus}:${lessonFocus}`, questions.length)];

  return `${getMentionedDetailComment(normalizedValue)} ${question}`;
};

export function evaluateReflectionForCoach({
  reflectionText,
  projectSlug,
  reflectionPrompt,
  lessonFocus,
}: ReflectionCoachEvaluationInput): ReflectionCoachEvaluation {
  const focus = lessonFocus ?? getReflectionCoachLessonFocus(reflectionPrompt);
  const trimmedValue = reflectionText.trim();
  const normalizedValue = trimmedValue.toLowerCase();
  const wordCount = trimmedValue.split(/\s+/).filter(Boolean).length;
  const nonSpaceCharacterCount = trimmedValue.replace(/\s/g, "").length;
  const detectedSignals = getDetectedSignals(normalizedValue);
  const recommendedFocus = getRecommendedFocus(detectedSignals);
  const rubric = getReflectionRubric(projectSlug);
  const projectSpecificEvaluation = rubric?.({ normalizedValue }) ?? null;

  if (!trimmedValue) {
    return {
      coachResult: "empty",
      detectedSignals,
      recommendedFocus: "specificity",
      lessonFocus: focus,
    };
  }

  if (projectSpecificEvaluation) {
    return {
      detectedSignals,
      ...projectSpecificEvaluation,
    };
  }

  const hasCoreDetail = detectedSignals.hasActionOrChange && detectedSignals.hasPageDetail;
  const isVeryShort = wordCount < 5 || nonSpaceCharacterCount < 20;

  if (isVeryShort || !hasCoreDetail) {
    return {
      coachResult: "weak",
      detectedSignals,
      recommendedFocus,
      lessonFocus: focus,
      followUpQuestion: getFollowUpQuestion({
        normalizedValue,
        recommendedFocus,
        lessonFocus: focus,
      }),
    };
  }

  return {
    coachResult: "strong",
    detectedSignals,
    recommendedFocus,
    lessonFocus: focus,
    positiveMessage: positiveMessageByFocus[focus],
  };
}
