import {
  hasHtmlContentChangeSignal,
  hasVisiblePageResultSignal,
} from "../signal-detection";
import type {
  ReflectionCoachRubricEvaluation,
  ReflectionCoachRubricInput,
} from "./index";

export const evaluateAllAboutMeReflection = ({
  normalizedValue,
}: ReflectionCoachRubricInput): ReflectionCoachRubricEvaluation => {
  const hasHtmlChange = hasHtmlContentChangeSignal(normalizedValue);
  const hasVisibleResult = hasVisiblePageResultSignal(normalizedValue);

  if (hasHtmlChange && hasVisibleResult) {
    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "html",
      positiveMessage: "Nice work — you named an HTML change and what it did on the page.",
    };
  }

  if (hasHtmlChange) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "causality",
      lessonFocus: "html",
      followUpQuestion: "What did that change add or show on your page?",
    };
  }

  if (hasVisibleResult) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "specificity",
      lessonFocus: "html",
      followUpQuestion: "What HTML part did you change, like a heading, paragraph, or list item?",
    };
  }

  return {
    coachResult: "weak",
    recommendedFocus: "specificity",
    lessonFocus: "html",
    followUpQuestion: "What HTML part did you change, like a heading, paragraph, or list item?",
  };
};
