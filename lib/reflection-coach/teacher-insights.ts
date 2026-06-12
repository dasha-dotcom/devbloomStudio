import type {
  ReflectionCoachAiAnalysis,
  ReflectionCoachAiCopiedExampleRisk,
  ReflectionCoachAiMisconceptionRisk,
  ReflectionCoachAiPersonalization,
  ReflectionCoachAiSpecificity,
  ReflectionCoachDetectedSignals,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
} from "@/lib/reflection-coach/types";

const MAX_TEACHER_INSIGHT_LENGTH = 240;
const MAX_ANALYSIS_TEXT_LENGTH = 180;
const MAX_ANALYSIS_ARRAY_ITEMS = 4;
const MAX_ANALYSIS_ARRAY_ITEM_LENGTH = 80;

const unsafeStructuredTextPattern =
  /```|`[^`]+`|\*\*|__|^#{1,6}\s|\[[^\]]+\]\([^)]+\)|^\s*[-*]\s+|^\s*[[{]|["'][a-z0-9_-]+["']\s*:|\b(stack trace|traceback|error:|at\s+\S+\s+\(.+:\d+:\d+\))\b/i;
const unsafePlainTextPattern =
  /\b(incorrect|insufficient|wrong|bad|failed|failure|lazy|cheated|copied|chain of thought|hidden reasoning|step-by-step reasoning|thought process|internal reasoning)\b/i;

type TeacherInsightInput = {
  coachResult: ReflectionCoachResult;
  detectedSignals?: ReflectionCoachDetectedSignals;
  recommendedFocus?: ReflectionCoachRecommendedFocus;
  analysis?: ReflectionCoachAiAnalysis;
  teacherInsight?: string;
};

const isSafeOptionalText = (value: string, maxLength: number) =>
  value.length <= maxLength &&
  !value.includes("\n") &&
  !unsafeStructuredTextPattern.test(value) &&
  !unsafePlainTextPattern.test(value);

const normalizeOptionalAnalysisText = (
  value: unknown,
  maxLength = MAX_ANALYSIS_TEXT_LENGTH,
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || !isSafeOptionalText(trimmed, maxLength)) {
    return undefined;
  }

  return trimmed;
};

const normalizeOptionalAnalysisStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value) || value.length > MAX_ANALYSIS_ARRAY_ITEMS) {
    return undefined;
  }

  const normalizedItems: string[] = [];

  for (const item of value) {
    const normalizedItem = normalizeOptionalAnalysisText(item, MAX_ANALYSIS_ARRAY_ITEM_LENGTH);

    if (normalizedItem) {
      normalizedItems.push(normalizedItem);
    }
  }

  return normalizedItems;
};

const isAiSpecificity = (value: unknown): value is ReflectionCoachAiSpecificity =>
  value === "empty" ||
  value === "generic" ||
  value === "somewhat_specific" ||
  value === "specific";

const isAiPersonalization = (value: unknown): value is ReflectionCoachAiPersonalization =>
  value === "none" ||
  value === "generic_example" ||
  value === "some_personal_detail" ||
  value === "clearly_personalized";

const isAiMisconceptionRisk = (
  value: unknown,
): value is ReflectionCoachAiMisconceptionRisk =>
  value === "none" ||
  value === "html_css_confusion" ||
  value === "html_js_confusion" ||
  value === "css_js_confusion" ||
  value === "event_result_confusion" ||
  value === "other";

const isAiCopiedExampleRisk = (value: unknown): value is ReflectionCoachAiCopiedExampleRisk =>
  value === "none" || value === "possible" || value === "likely";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const sanitizeReflectionCoachTeacherInsight = (value: unknown) =>
  normalizeOptionalAnalysisText(value, MAX_TEACHER_INSIGHT_LENGTH);

export const sanitizeReflectionCoachAiAnalysis = (
  value: unknown,
): ReflectionCoachAiAnalysis | undefined => {
  if (
    !isRecord(value) ||
    !isAiSpecificity(value.specificity) ||
    !isAiPersonalization(value.personalization) ||
    !isAiMisconceptionRisk(value.misconceptionRisk)
  ) {
    return undefined;
  }

  const misconceptionNote = normalizeOptionalAnalysisText(value.misconceptionNote);
  const inferredStudentUnderstanding = normalizeOptionalAnalysisStringArray(
    value.inferredStudentUnderstanding,
  );
  const missingConcepts = normalizeOptionalAnalysisStringArray(value.missingConcepts);
  const copiedExampleRisk = isAiCopiedExampleRisk(value.copiedExampleRisk)
    ? value.copiedExampleRisk
    : "none";

  return {
    specificity: value.specificity,
    personalization: value.personalization,
    misconceptionRisk: value.misconceptionRisk,
    ...(misconceptionNote ? { misconceptionNote } : {}),
    ...(inferredStudentUnderstanding ? { inferredStudentUnderstanding } : {}),
    ...(missingConcepts ? { missingConcepts } : {}),
    copiedExampleRisk,
  };
};

const getMisconceptionTeacherInsight = (
  risk: ReflectionCoachAiMisconceptionRisk,
): string | undefined => {
  if (risk === "html_css_confusion") {
    return "Student may be confusing HTML content with CSS styling.";
  }

  if (risk === "css_js_confusion") {
    return "Student may be confusing CSS styling with JavaScript interactions.";
  }

  if (risk === "html_js_confusion") {
    return "Student may be confusing direct HTML/content edits with JavaScript actions.";
  }

  if (risk === "event_result_confusion") {
    return "Student may need support connecting the action that triggered JavaScript to the result on the page.";
  }

  if (risk === "other") {
    return "Student may need a brief clarification about the coding idea in the reflection.";
  }

  return undefined;
};

const getMissingConceptsInsight = (missingConcepts: string[] | undefined) => {
  if (!missingConcepts?.length) {
    return undefined;
  }

  return `Student may need support adding: ${missingConcepts.slice(0, 3).join(", ")}.`;
};

export const deriveReflectionCoachTeacherInsight = ({
  coachResult,
  detectedSignals,
  recommendedFocus,
  analysis,
  teacherInsight,
}: TeacherInsightInput): string | undefined => {
  const sanitizedTeacherInsight = sanitizeReflectionCoachTeacherInsight(teacherInsight);

  if (sanitizedTeacherInsight) {
    return sanitizedTeacherInsight;
  }

  if (
    detectedSignals?.hasCopiedExample ||
    recommendedFocus === "make_it_yours" ||
    analysis?.copiedExampleRisk === "likely"
  ) {
    return "Reflection appears close to the example and may need more personalization.";
  }

  const misconceptionInsight = analysis
    ? getMisconceptionTeacherInsight(analysis.misconceptionRisk)
    : undefined;

  if (misconceptionInsight) {
    return misconceptionInsight;
  }

  const missingConceptsInsight = getMissingConceptsInsight(analysis?.missingConcepts);

  if (missingConceptsInsight) {
    return missingConceptsInsight;
  }

  if (analysis && (coachResult === "weak" || coachResult === "almost_there")) {
    return "Reflection is relevant but needs one more specific code/page detail.";
  }

  return undefined;
};
