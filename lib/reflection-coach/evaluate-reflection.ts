import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
  ReflectionCoachEvaluationInput,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
} from "@/lib/reflection-coach/types";

const followUpQuestionByFocus: Record<ReflectionCoachFocus, string> = {
  html: "What part of the page did HTML control?",
  css: "What style changed on the page?",
  javascript: "What made the page react?",
  general: "What specific part of your project changed?",
};

const positiveMessageByFocus: Record<ReflectionCoachFocus, string> = {
  html: "Nice start — you named a real part of the page that HTML controlled.",
  css: "Nice start — you explained a style change on the page.",
  javascript: "Nice start — you described what made the page react.",
  general: "Nice start — you named a specific part of your project.",
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

const getDetectedSignals = (normalizedValue: string): ReflectionCoachDetectedSignals => ({
  hasSpecificEdit: /(changed|added|updated|customized|picked|set|wrote|made).*(title|intro|paragraph|list|image|button|background|color|card|text|theme|mood|style|heading)/.test(
    normalizedValue,
  ),
  hasPageDetail: /(title|intro|paragraph|list|image|page|button|emoji|background|color|card|text|theme|mood|style|heading|tag|selector|rule|event|click)/.test(
    normalizedValue,
  ),
  hasActionOrChange: /(changed|added|made|updated|styled|used|clicked|switched|customized|wrote|picked|set|controlled|react|reacted)/.test(
    normalizedValue,
  ),
  hasConceptConnection: /(html|css|javascript|js|tag|selector|rule|class|style|button|click|event)/.test(
    normalizedValue,
  ),
  hasReasonOrChoice: /(because|wanted|chose|choose|feel|feels|so that|to make|i like|i wanted)/.test(
    normalizedValue,
  ),
});

const getRecommendedFocus = (
  signals: ReflectionCoachDetectedSignals,
): ReflectionCoachRecommendedFocus => {
  if (!signals.hasSpecificEdit && !signals.hasPageDetail) {
    return "specificity";
  }

  if (!signals.hasActionOrChange) {
    return "causality";
  }

  if (!signals.hasConceptConnection) {
    return "concept_connection";
  }

  return "ownership";
};

export function evaluateReflectionForCoach({
  reflectionText,
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

  if (!trimmedValue) {
    return {
      coachResult: "empty",
      detectedSignals,
      recommendedFocus: "specificity",
      lessonFocus: focus,
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
      followUpQuestion: followUpQuestionByFocus[focus],
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
