import {
  hasCssStyleChangeSignal,
  hasHtmlContentChangeSignal,
  hasJavaScriptActionSignal,
  hasJavaScriptPageResultSignal,
} from "../signal-detection";
import type {
  ReflectionCoachRubricEvaluation,
  ReflectionCoachRubricInput,
} from "./index";

const hasMiniSiteButtonMessageCustomization = (normalizedValue: string) =>
  /\b(button message|button text|button words|button label)\b.{0,40}\bto\b/.test(
    normalizedValue,
  );

const getMiniSiteCategorySignals = (normalizedValue: string) => ({
  hasHtml: hasHtmlContentChangeSignal(normalizedValue),
  hasCss: hasCssStyleChangeSignal(normalizedValue),
  hasJavaScript:
    hasJavaScriptActionSignal(normalizedValue) ||
    hasJavaScriptPageResultSignal(normalizedValue) ||
    hasMiniSiteButtonMessageCustomization(normalizedValue),
});

const getMiniSiteMissingCategoryQuestion = (missingCategories: Array<"HTML" | "CSS" | "JavaScript">) => {
  const labelByCategory: Record<"HTML" | "CSS" | "JavaScript", string> = {
    HTML: "HTML/content",
    CSS: "CSS/style",
    JavaScript: "JavaScript/button or interactive",
  };

  if (missingCategories.length === 1) {
    return `What did you customize with ${labelByCategory[missingCategories[0]]}?`;
  }

  if (missingCategories.length === 2) {
    return `Can you also name a ${labelByCategory[missingCategories[0]]} customization and a ${labelByCategory[missingCategories[1]]} customization?`;
  }

  return "Can you name one specific thing you changed in HTML/content, CSS/style, or JavaScript/button behavior?";
};

export const evaluateBuildYourOwnMiniSiteReflection = ({
  detectedSignals,
  normalizedValue,
}: ReflectionCoachRubricInput): ReflectionCoachRubricEvaluation => {
  const { hasHtml, hasCss, hasJavaScript } = getMiniSiteCategorySignals(normalizedValue);
  const missingCategories = [
    hasHtml ? null : "HTML",
    hasCss ? null : "CSS",
    hasJavaScript ? null : "JavaScript",
  ].filter((category): category is "HTML" | "CSS" | "JavaScript" => Boolean(category));

  if (detectedSignals.hasCopiedExample) {
    return {
      coachResult: "weak",
      recommendedFocus: "make_it_yours",
      lessonFocus: "general",
      followUpQuestion:
        "That sounds close to the example. Can you add your own title, color, or button message?",
    };
  }

  if (missingCategories.length === 3) {
    return {
      coachResult: "weak",
      recommendedFocus: "concept_connection",
      lessonFocus: "general",
      followUpQuestion: getMiniSiteMissingCategoryQuestion(missingCategories),
    };
  }

  if (missingCategories.length > 0) {
    return {
      coachResult: "almost_there",
      recommendedFocus: "concept_connection",
      lessonFocus: "general",
      followUpQuestion: getMiniSiteMissingCategoryQuestion(missingCategories),
    };
  }

  return {
    coachResult: "strong",
    recommendedFocus: "ownership",
    lessonFocus: "general",
    positiveMessage: "Nice work — you covered what you customized in HTML, CSS, and JavaScript.",
  };
};
