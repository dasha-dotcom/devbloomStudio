import {
  hasHtmlContentChangeSignal,
  hasHtmlPersonalizedContentResultSignal,
  hasVisiblePageResultSignal,
} from "../signal-detection";
import type {
  ReflectionCoachRubricEvaluation,
  ReflectionCoachRubricInput,
} from "./index";

export const evaluateAllAboutMeReflection = ({
  detectedSignals,
  normalizedValue,
}: ReflectionCoachRubricInput): ReflectionCoachRubricEvaluation => {
  const hasHtmlChange = hasHtmlContentChangeSignal(normalizedValue);
  const hasVisibleResult =
    hasVisiblePageResultSignal(normalizedValue) ||
    hasHtmlPersonalizedContentResultSignal(normalizedValue);

  if (detectedSignals.hasCopiedExample) {
    return {
      coachResult: "weak",
      recommendedFocus: "make_it_yours",
      lessonFocus: "html",
      followUpQuestion: "That sounds close to the example. Can you make it about your own page?",
    };
  }

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
