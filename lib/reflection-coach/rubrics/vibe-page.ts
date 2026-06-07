import {
  hasCssStyleChangeSignal,
  hasCssTargetingSignal,
  hasCssVisibleDesignResultSignal,
  hasImpliedCssVisibleResultSignal,
} from "../signal-detection";
import type {
  ReflectionCoachRubricEvaluation,
  ReflectionCoachRubricInput,
} from "./index";

export const evaluateVibePageReflection = ({
  detectedSignals,
  normalizedValue,
}: ReflectionCoachRubricInput): ReflectionCoachRubricEvaluation => {
  const hasStyleChange = hasCssStyleChangeSignal(normalizedValue);
  const hasCssTargeting = hasCssTargetingSignal(normalizedValue);
  const hasVisibleDesignResult = hasCssVisibleDesignResultSignal(normalizedValue);
  const hasImpliedVisibleResult = hasImpliedCssVisibleResultSignal(normalizedValue);

  if (detectedSignals.hasCopiedExample) {
    return {
      coachResult: "weak",
      recommendedFocus: "make_it_yours",
      lessonFocus: "css",
      followUpQuestion: "That sounds close to the example. Can you describe your own style change?",
    };
  }

  if (hasStyleChange && (hasCssTargeting || hasVisibleDesignResult || hasImpliedVisibleResult)) {
    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "css",
      positiveMessage: "Nice work — you connected a CSS style change to how the page looked.",
    };
  }

  if (hasStyleChange) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "concept_connection",
      lessonFocus: "css",
      followUpQuestion: "What part of the page changed, or how did that style change the design?",
    };
  }

  if (hasCssTargeting) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "specificity",
      lessonFocus: "css",
      followUpQuestion: "What style did you change, like a color, text, spacing, or card style?",
    };
  }

  if (hasVisibleDesignResult) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "specificity",
      lessonFocus: "css",
      followUpQuestion: "What style did you change to make that part look different?",
    };
  }

  return {
    coachResult: "weak",
    recommendedFocus: "specificity",
    lessonFocus: "css",
    followUpQuestion: "What style did you change, like a color, text, spacing, or card style?",
  };
};
