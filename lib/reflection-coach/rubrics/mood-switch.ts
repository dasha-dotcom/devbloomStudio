import {
  hasJavaScriptActionSignal,
  hasJavaScriptPageResultSignal,
} from "../signal-detection";
import type {
  ReflectionCoachRubricEvaluation,
  ReflectionCoachRubricInput,
} from "./index";

export const evaluateMoodSwitchReflection = ({
  detectedSignals,
  normalizedValue,
}: ReflectionCoachRubricInput): ReflectionCoachRubricEvaluation => {
  const hasEvent = hasJavaScriptActionSignal(normalizedValue);
  const hasPageResult = hasJavaScriptPageResultSignal(normalizedValue);

  if (detectedSignals.hasCopiedExample) {
    return {
      coachResult: "weak",
      recommendedFocus: "make_it_yours",
      lessonFocus: "javascript",
      followUpQuestion: "That sounds close to the example. What message or mood did your button show?",
    };
  }

  if (hasEvent && hasPageResult) {
    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "javascript",
      positiveMessage: "Nice work — you connected the action to the page change.",
    };
  }

  if (hasEvent) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "specificity",
      lessonFocus: "javascript",
      followUpQuestion: "What changed on the page after that action?",
    };
  }

  if (hasPageResult) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "causality",
      lessonFocus: "javascript",
      followUpQuestion: "What action made the JavaScript run?",
    };
  }

  return {
    coachResult: "weak",
    recommendedFocus: "causality",
    lessonFocus: "javascript",
    followUpQuestion: "What action made the JavaScript run?",
  };
};
