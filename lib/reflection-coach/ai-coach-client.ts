import type {
  ReflectionCoachAiAnalysis,
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
  ReflectionCoachFallbackDebugDetail,
  ReflectionCoachFallbackReason,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
} from "@/lib/reflection-coach/types";
import {
  applyDeterministicMisconceptionGuard,
  getMisconceptionClarificationMessage,
  getMisconceptionFollowUpQuestion,
  hasMisconceptionClarification,
} from "./misconception-detection";

type AiReflectionCoachInput = {
  projectSlug: string;
  projectTitle: string;
  lessonTitle?: string;
  reflectionPrompt?: string;
  reflectionPlaceholder?: string;
  lessonFocus: ReflectionCoachFocus;
  reflectionText: string;
  localEvaluation: ReflectionCoachEvaluation;
};

type OpenAiChatMessage = {
  role: "system" | "user";
  content: string;
};

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type ReflectionCoachAiResult =
  | {
      evaluation: ReflectionCoachEvaluation;
      fallbackReason?: never;
    }
  | {
      evaluation: null;
      fallbackReason: ReflectionCoachFallbackReason;
      fallbackDebugDetail?: ReflectionCoachFallbackDebugDetail;
    };

type ParsedJsonObjectResult =
  | {
      value: unknown;
      fallbackReason?: never;
    }
  | {
      value: null;
      fallbackReason: ReflectionCoachFallbackReason;
    };

type AiValidationResult =
  | {
      evaluation: ReflectionCoachEvaluation;
      fallbackReason?: never;
    }
  | {
      evaluation: null;
      fallbackReason: ReflectionCoachFallbackReason;
      fallbackDebugDetail?: ReflectionCoachFallbackDebugDetail;
    };

const MAX_COACH_TEXT_LENGTH = 180;
const MAX_TEACHER_INSIGHT_LENGTH = 240;
const MAX_ANALYSIS_TEXT_LENGTH = 180;
const MAX_ANALYSIS_ARRAY_ITEMS = 4;
const MAX_ANALYSIS_ARRAY_ITEM_LENGTH = 80;
const MAX_REFLECTION_CHARS_FOR_AI = 1000;
const MAX_PROVIDER_RESPONSE_CHARS = 4000;

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

const hasMatchingDetectedSignals = (
  value: ReflectionCoachDetectedSignals,
  fallback: ReflectionCoachDetectedSignals,
) =>
  value.hasSpecificEdit === fallback.hasSpecificEdit &&
  value.hasPageDetail === fallback.hasPageDetail &&
  value.hasActionOrChange === fallback.hasActionOrChange &&
  value.hasConceptConnection === fallback.hasConceptConnection &&
  value.hasReasonOrChoice === fallback.hasReasonOrChoice &&
  value.hasCopiedExample === fallback.hasCopiedExample;

const getAuthoritativeMismatchDebugDetail = ({
  detectedSignals,
  fallbackDetectedSignals,
  recommendedFocus,
  fallbackRecommendedFocus,
  lessonFocus,
  fallbackLessonFocus,
}: {
  detectedSignals: ReflectionCoachDetectedSignals;
  fallbackDetectedSignals: ReflectionCoachDetectedSignals;
  recommendedFocus: ReflectionCoachRecommendedFocus;
  fallbackRecommendedFocus: ReflectionCoachRecommendedFocus;
  lessonFocus: ReflectionCoachFocus;
  fallbackLessonFocus: ReflectionCoachFocus;
}): ReflectionCoachFallbackDebugDetail => {
  if (!hasMatchingDetectedSignals(detectedSignals, fallbackDetectedSignals)) {
    return "detectedSignals";
  }

  if (recommendedFocus !== fallbackRecommendedFocus) {
    return "recommendedFocus";
  }

  if (lessonFocus !== fallbackLessonFocus) {
    return "lessonFocus";
  }

  return "messageShape";
};

const harshLanguagePattern = /\b(incorrect|insufficient|wrong|bad|failed|failure|lazy|cheated|copied)\b/i;
const codeLikeOutputPattern =
  /\b(paste|copy this|use this code|function|const|let|var|document\.|console\.)\b|[{}<>]/i;
const markdownPattern =
  /```|`[^`]+`|\*\*|__|^#{1,6}\s|\[[^\]]+\]\([^)]+\)|^\s*[-*]\s+/i;
const jsonLikeOutputPattern = /^\s*[[{]|["'][a-z0-9_-]+["']\s*:/i;
const stackTracePattern = /\b(stack trace|traceback|error:|at\s+\S+\s+\(.+:\d+:\d+\))\b/i;
const hiddenReasoningPattern =
  /\b(chain of thought|hidden reasoning|step-by-step reasoning|reasoning:|thought process|internal reasoning|my reasoning)\b/i;
const longTechnicalExplanationPattern =
  /\b(runtime|compiler|syntax tree|object model|execution context|call stack|serialization|deserialization|regular expression|dom api)\b/i;

const rewrittenReflectionFieldNames = new Set([
  "finalReflection",
  "suggestedFinalReflection",
  "rewrittenReflection",
  "reflectionRewrite",
  "improvedReflection",
  "studentAnswer",
]);

const hasRewrittenReflectionField = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(hasRewrittenReflectionField);
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, item]) => rewrittenReflectionFieldNames.has(key) || hasRewrittenReflectionField(item),
  );
};

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

const hasUnsafeStructuredText = (trimmed: string, allowTechnicalTerms = true) =>
  markdownPattern.test(trimmed) ||
  jsonLikeOutputPattern.test(trimmed) ||
  stackTracePattern.test(trimmed) ||
  hiddenReasoningPattern.test(trimmed) ||
  (!allowTechnicalTerms && longTechnicalExplanationPattern.test(trimmed));

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

  if (
    trimmed.length > maxLength ||
    trimmed.includes("\n") ||
    harshLanguagePattern.test(trimmed) ||
    codeLikeOutputPattern.test(trimmed) ||
    hasUnsafeStructuredText(trimmed)
  ) {
    return null;
  }

  return trimmed;
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

const normalizeAiAnalysis = (value: unknown): ReflectionCoachAiAnalysis | null => {
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

const getConfiguredChatCompletionsUrl = () => {
  const baseUrl = process.env.REFLECTION_COACH_BASE_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return normalizedBaseUrl.endsWith("/chat/completions")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/chat/completions`;
};

const getProviderName = () =>
  process.env.REFLECTION_COACH_PROVIDER_NAME?.trim() || "OpenAI-compatible provider";

export const hasReflectionCoachAiConfig = () =>
  Boolean(
    process.env.REFLECTION_COACH_API_KEY?.trim() &&
      process.env.REFLECTION_COACH_BASE_URL?.trim() &&
      process.env.REFLECTION_COACH_MODEL?.trim(),
  );

const getProjectPromptTarget = (projectSlug: string) => {
  if (projectSlug === "all-about-me") {
    return {
      project: "Make a Page About Something You Like",
      strongWhen: [
        "Student names one concrete HTML or page content change.",
        "Student explains what that change added, showed, or changed on the visible page.",
      ],
      weakFollowUpPriority: [
        "If no concrete HTML/content change is named, ask: What HTML part did you change, like a heading, paragraph, or list item?",
        "If the HTML/content change is named but the visible result is missing, ask: What did that change add or show on your page?",
      ],
      strongPositiveMessage:
        "Mention that they named the HTML change and what it did on the page.",
    };
  }

  if (projectSlug === "vibe-page") {
    return {
      project: "Vibe Page",
      strongWhen: [
        "Student names one concrete CSS style change.",
        "Student explains how CSS knew what to style using a selector, class, element, or similar targeting idea, or names the visible design result.",
      ],
      weakFollowUpPriority: [
        "If no style change is named, ask: What style did you change, like a color, text, spacing, or card style?",
        "If a style change is named but CSS targeting is missing, ask: What selector, class, or element helped CSS find that part of the page?",
      ],
      strongPositiveMessage:
        "Mention that they connected a CSS style change to how CSS targeted the page part.",
    };
  }

  if (projectSlug === "mood-switch") {
    return {
      project: "Mood Switch",
      strongWhen: [
        "Student names the action or event that made JavaScript run, usually a button click.",
        "Student names what changed on the page, such as text, message, mood, color, or class.",
      ],
      weakFollowUpPriority: [
        "If the action/event is missing, ask: What action made the JavaScript run?",
        "If the action/event is named but the page result is missing, ask: What changed on the page after that action?",
      ],
      strongPositiveMessage:
        "Mention that they connected the user action or event to the page change.",
    };
  }

  if (projectSlug === "build-your-own-mini-site") {
    return {
      project: "Build Your Own Mini Site",
      strongWhen: [
        "Student names at least one specific HTML customization detail.",
        "Student names at least one specific CSS customization detail.",
        "Student names at least one specific JavaScript customization detail.",
      ],
      weakFollowUpPriority: [
        "If HTML is missing, ask: What did you customize with HTML?",
        "If CSS is missing, ask: What did you customize with CSS?",
        "If JavaScript is missing, ask: What did you customize with JavaScript?",
        "If multiple categories are missing, ask: Can you name one thing you changed in HTML, CSS, and JavaScript?",
      ],
      strongPositiveMessage:
        "Mention that they covered what they customized in HTML, CSS, and JavaScript.",
    };
  }

  return {
    project: projectSlug,
    strongWhen: [
      "Student names what they changed.",
      "Student explains what happened on the page.",
      "Student connects the change to the lesson concept.",
    ],
    weakFollowUpPriority: [
      "Ask one short question about the most important missing part of the reflection prompt.",
    ],
    strongPositiveMessage:
      "Mention the specific prompt target the student answered.",
  };
};

const getMessages = ({
  projectSlug,
  projectTitle,
  lessonTitle,
  reflectionPrompt,
  reflectionPlaceholder,
  lessonFocus,
  reflectionText,
  localEvaluation,
}: AiReflectionCoachInput): OpenAiChatMessage[] => [
  {
    role: "system",
    content:
      "You are Sprout, a warm reflection coach for students ages 9-12. You are not a chatbot, coding tutor, grader, or code generator. A local evaluator has already judged the reflection. Do not re-grade it. Return only one JSON object. Do not write or rewrite the student's reflection. Do not provide code. Do not ask more than one question. Avoid harsh words like incorrect or insufficient.",
  },
  {
    role: "user",
    content: JSON.stringify({
      task: "Write one bounded Sprout response using the authoritative local evaluation.",
      outputShape: {
        coachResult: "Copy exactly from authoritativeLocalEvaluation.coachResult.",
        detectedSignals: {
          hasSpecificEdit: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasSpecificEdit.",
          hasPageDetail: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasPageDetail.",
          hasActionOrChange: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasActionOrChange.",
          hasConceptConnection: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasConceptConnection.",
          hasReasonOrChoice: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasReasonOrChoice.",
          hasCopiedExample: "Copy exactly from authoritativeLocalEvaluation.detectedSignals.hasCopiedExample.",
        },
        recommendedFocus: "Copy exactly from authoritativeLocalEvaluation.recommendedFocus.",
        lessonFocus: "Copy exactly from authoritativeLocalEvaluation.lessonFocus.",
        analysis: {
          required: "Required in every response. Any response without analysis is invalid.",
          specificity: "Required. One of: empty, generic, somewhat_specific, specific.",
          personalization:
            "Required. One of: none, generic_example, some_personal_detail, clearly_personalized.",
          misconceptionRisk:
            "Required. One of: none, html_css_confusion, html_js_confusion, css_js_confusion, event_result_confusion, other.",
          misconceptionNote:
            "Include only when misconceptionRisk is not none. Omit when misconceptionRisk is none.",
          inferredStudentUnderstanding:
            "Required array of up to 4 short phrases. Use [] when there is nothing to add.",
          missingConcepts:
            "Required array of up to 4 short phrases. Use [] when there is nothing to add.",
          copiedExampleRisk: "Required. One of: none, possible, likely.",
        },
        followUpQuestion:
          "Only if coachResult is weak or almost_there. Vary the wording, but ask only about authoritativeLocalEvaluation.followUpQuestion.",
        positiveMessage:
          "Only if coachResult is strong. Omit this field completely for weak, almost_there, and empty.",
        teacherInsight:
          "Optional one-sentence teacher-facing insight. Keep it concise and do not include hidden reasoning.",
      },
      rules: [
        "The authoritativeLocalEvaluation is final. Do not change coachResult, detectedSignals, recommendedFocus, or lessonFocus.",
        "analysis is required in every response. Any response without analysis is invalid.",
        "Always include analysis.specificity, analysis.personalization, analysis.misconceptionRisk, analysis.inferredStudentUnderstanding, analysis.missingConcepts, and analysis.copiedExampleRisk.",
        "Use [] for analysis.inferredStudentUnderstanding and analysis.missingConcepts when there is nothing to add.",
        "Include analysis.misconceptionNote only when analysis.misconceptionRisk is not none.",
        "Return JSON only. Do not include markdown, code blocks, bullet lists, stack traces, or JSON inside string fields.",
        "Do not include hidden reasoning, chain-of-thought, or step-by-step analysis.",
        "If coachResult is weak or almost_there, write exactly one short follow-up question about the same missing idea as authoritativeLocalEvaluation.followUpQuestion.",
        "If coachResult is weak or almost_there, you may mention one detail the student wrote, but do not ask about a different missing idea.",
        "If coachResult is weak or almost_there, do not include positiveMessage.",
        "If coachResult is strong, give one short positive message and no follow-up question. If analysis finds a misconception, the positiveMessage may briefly clarify it without saying the student is wrong.",
        "If coachResult is empty, do not invent details.",
        "Never write a replacement reflection for the student.",
        "Never include code or coding instructions.",
        "Do not say weak, copied, incorrect, insufficient, wrong, or failed in student-facing text.",
        "Use beginner terms only unless the lesson used the term. HTML, CSS, JavaScript, class, style, button, message, page, and heading are allowed.",
        "A misconception requires the student to attribute a concept to the wrong technology or describe an incorrect code/page relationship.",
        "Missing specificity, missing page result, missing CSS targeting/class detail, or missing JavaScript event/action detail is not a misconception by itself. Put those in analysis.missingConcepts and the follow-up instead.",
        "Examples that are incomplete but not misconceptions in a CSS lesson: I changed the color; I made it pink; I styled the card. Examples that are incomplete but not misconceptions in other lessons: I changed the heading; My page says cats; The message changed; When I clicked the button.",
        "If a student says HTML changed background color, color, theme, font, size, border, spacing, layout, rounded corners, or other style words, set analysis.misconceptionRisk to html_css_confusion.",
        "In an HTML lesson, if the student says they changed a style, color, background, theme, font, size, border, layout, rounded corners, or named color, set analysis.misconceptionRisk to html_css_confusion.",
        "Do not use html_css_confusion when the student only says a CSS style changed in a CSS lesson, such as I changed the color, I made it pink, or I styled the card.",
        "If an HTML lesson reflection says CSS directly changed a heading, title, paragraph, words, text, image, link, list, or other page content, set analysis.misconceptionRisk to html_css_confusion.",
        "Use html_js_confusion only when the student explicitly says JavaScript or JS directly changed a heading, title, paragraph, words, text, image, link, list item, or page content without an action.",
        "Do not use html_js_confusion when the student does not mention JavaScript or JS. Missing a JavaScript customization detail is not a misconception.",
        "If a student says CSS made a button click, message change, show/hide behavior, alert, mood change, or other interaction happen, set analysis.misconceptionRisk to css_js_confusion.",
        "If analysis.misconceptionRisk is not none, the student-facing message must gently clarify the misconception.",
        "Do not tell the student to include something that the authoritative local evaluation already says is present.",
      ],
      authoritativeLocalEvaluation: localEvaluation,
      responseTask:
        localEvaluation.coachResult === "weak" || localEvaluation.coachResult === "almost_there"
          ? {
              kind: "ask_follow_up",
              targetQuestion: localEvaluation.followUpQuestion ?? "",
            }
          : localEvaluation.coachResult === "strong"
            ? {
                kind: "positive_message",
                targetMessage: localEvaluation.positiveMessage ?? "",
              }
            : {
                kind: "empty_reflection",
              },
      projectSlug,
      projectTitle,
      lessonTitle: lessonTitle ?? "",
      reflectionPrompt: reflectionPrompt ?? "",
      reflectionPlaceholder: reflectionPlaceholder ?? "",
      projectPromptTarget: getProjectPromptTarget(projectSlug),
      lessonFocus,
      lessonFocusMeaning: {
        html: "structure/content on the page",
        css: "style/look/feel",
        javascript: "interaction/reaction/click behavior",
        general: "project change/result",
      }[lessonFocus],
      studentReflection: reflectionText.slice(0, MAX_REFLECTION_CHARS_FOR_AI),
      requiredFinalJsonShape: {
        coachResult: "<copy exactly from authoritativeLocalEvaluation.coachResult>",
        detectedSignals: {
          hasSpecificEdit:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasSpecificEdit>",
          hasPageDetail:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasPageDetail>",
          hasActionOrChange:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasActionOrChange>",
          hasConceptConnection:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasConceptConnection>",
          hasReasonOrChoice:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasReasonOrChoice>",
          hasCopiedExample:
            "<copy exactly from authoritativeLocalEvaluation.detectedSignals.hasCopiedExample>",
        },
        recommendedFocus: "<copy exactly from authoritativeLocalEvaluation.recommendedFocus>",
        lessonFocus: "<copy exactly from authoritativeLocalEvaluation.lessonFocus>",
        analysis: {
          specificity: "<required: empty | generic | somewhat_specific | specific>",
          personalization:
            "<required: none | generic_example | some_personal_detail | clearly_personalized>",
          misconceptionRisk:
            "<required: none | html_css_confusion | html_js_confusion | css_js_confusion | event_result_confusion | other>",
          misconceptionNote:
            "<include only when misconceptionRisk is not none; otherwise omit>",
          inferredStudentUnderstanding: [],
          missingConcepts: [],
          copiedExampleRisk: "<required: none | possible | likely>",
        },
        followUpQuestion:
          "<only for weak or almost_there; exactly one short question; omit for strong and empty>",
        positiveMessage:
          "<only for strong; one short safe message; omit for weak, almost_there, and empty>",
        teacherInsight: "<optional one short safe teacher-facing sentence>",
      },
      requiredFinalJsonShapeRules: [
        "The analysis object above is required every time.",
        "A response without analysis is invalid.",
        "The arrays inside analysis must be present; use [] if empty.",
      ],
    }),
  },
];

const extractContent = (payload: OpenAiChatCompletionResponse) => {
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
};

const parseJsonObjectFromContent = (content: string): ParsedJsonObjectResult => {
  const trimmed = content.trim();

  try {
    return { value: JSON.parse(trimmed) };
  } catch {
    const startIndex = trimmed.indexOf("{");
    const endIndex = trimmed.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return { value: null, fallbackReason: "invalid_json" };
    }

    try {
      return { value: JSON.parse(trimmed.slice(startIndex, endIndex + 1)) };
    } catch {
      return { value: null, fallbackReason: "invalid_json" };
    }
  }
};

const getQuestionMarkCount = (value: string) => (value.match(/\?/g) ?? []).length;

const getUnsafeCoachTextReason = (
  value: unknown,
  tooLongReason: "follow_up_too_long" | "positive_message_too_long",
): ReflectionCoachFallbackReason | null => {
  if (typeof value !== "string") {
    return "missing_required_field";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "missing_required_field";
  }

  if (trimmed.length > MAX_COACH_TEXT_LENGTH || trimmed.includes("\n")) {
    return tooLongReason;
  }

  if (harshLanguagePattern.test(trimmed) || hiddenReasoningPattern.test(trimmed)) {
    return "harsh_language";
  }

  if (
    codeLikeOutputPattern.test(trimmed) ||
    hasUnsafeStructuredText(trimmed, false)
  ) {
    return "code_like_output";
  }

  return null;
};

const normalizeTeacherInsight = (
  value: unknown,
): { value?: string; fallbackReason?: ReflectionCoachFallbackReason } => {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== "string") {
    return { fallbackReason: "missing_required_field" };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  if (trimmed.length > MAX_TEACHER_INSIGHT_LENGTH) {
    return { fallbackReason: "teacher_insight_too_long" };
  }

  if (trimmed.includes("\n")) {
    return { fallbackReason: "code_like_output" };
  }

  if (harshLanguagePattern.test(trimmed) || hiddenReasoningPattern.test(trimmed)) {
    return { fallbackReason: "harsh_language" };
  }

  if (codeLikeOutputPattern.test(trimmed) || hasUnsafeStructuredText(trimmed)) {
    return { fallbackReason: "code_like_output" };
  }

  return { value: trimmed };
};

export const validateReflectionCoachAiEvaluation = (
  rawValue: unknown,
  fallback: ReflectionCoachEvaluation,
  reflectionText: string,
): AiValidationResult => {
  if (!isRecord(rawValue)) {
    return { evaluation: null, fallbackReason: "invalid_json" };
  }

  if (hasRewrittenReflectionField(rawValue)) {
    return { evaluation: null, fallbackReason: "rewritten_reflection_field" };
  }

  const coachResult = isReflectionCoachResult(rawValue.coachResult) ? rawValue.coachResult : null;

  if (!coachResult) {
    return { evaluation: null, fallbackReason: "invalid_coach_result" };
  }

  if (!reflectionText.trim() && coachResult !== "empty") {
    return {
      evaluation: null,
      fallbackReason: "status_mismatch",
      fallbackDebugDetail: "coachResult",
    };
  }

  if (reflectionText.trim() && coachResult === "empty") {
    return {
      evaluation: null,
      fallbackReason: "status_mismatch",
      fallbackDebugDetail: "coachResult",
    };
  }

  if (coachResult !== fallback.coachResult) {
    return {
      evaluation: null,
      fallbackReason: "status_mismatch",
      fallbackDebugDetail: "coachResult",
    };
  }

  const detectedSignals = normalizeDetectedSignals(rawValue.detectedSignals);
  const recommendedFocus = isReflectionCoachRecommendedFocus(rawValue.recommendedFocus)
    ? rawValue.recommendedFocus
    : null;
  const lessonFocus = isReflectionCoachFocus(rawValue.lessonFocus) ? rawValue.lessonFocus : null;

  if (!detectedSignals || !recommendedFocus) {
    return { evaluation: null, fallbackReason: "missing_required_field" };
  }

  if (!lessonFocus) {
    return { evaluation: null, fallbackReason: "invalid_lesson_focus" };
  }

  if (
    !hasMatchingDetectedSignals(detectedSignals, fallback.detectedSignals) ||
    recommendedFocus !== fallback.recommendedFocus ||
    lessonFocus !== fallback.lessonFocus
  ) {
    const fallbackDebugDetail = getAuthoritativeMismatchDebugDetail({
      detectedSignals,
      fallbackDetectedSignals: fallback.detectedSignals,
      recommendedFocus,
      fallbackRecommendedFocus: fallback.recommendedFocus,
      lessonFocus,
      fallbackLessonFocus: fallback.lessonFocus,
    });
    return { evaluation: null, fallbackReason: "status_mismatch", fallbackDebugDetail };
  }

  const analysis = normalizeAiAnalysis(rawValue.analysis);

  if (!analysis) {
    return { evaluation: null, fallbackReason: "invalid_analysis" };
  }

  const guardedAnalysis = applyDeterministicMisconceptionGuard({
    analysis,
    reflectionText,
    lessonFocus: fallback.lessonFocus,
  });
  const didRemoveMisconceptionRisk =
    analysis.misconceptionRisk !== "none" && guardedAnalysis.misconceptionRisk === "none";

  const teacherInsight = normalizeTeacherInsight(rawValue.teacherInsight);

  if (teacherInsight.fallbackReason) {
    return { evaluation: null, fallbackReason: teacherInsight.fallbackReason };
  }

  const localEvaluationBase = {
    coachResult: fallback.coachResult,
    detectedSignals: fallback.detectedSignals,
    recommendedFocus: fallback.recommendedFocus,
    lessonFocus: fallback.lessonFocus,
    analysis: guardedAnalysis,
    ...(teacherInsight.value ? { teacherInsight: teacherInsight.value } : {}),
  };

  if (coachResult === "empty") {
    if (rawValue.followUpQuestion !== undefined || rawValue.positiveMessage !== undefined) {
      return {
        evaluation: null,
        fallbackReason: "status_mismatch",
        fallbackDebugDetail: "messageShape",
      };
    }

    return {
      evaluation: localEvaluationBase,
    };
  }

  if (coachResult === "weak" || coachResult === "almost_there") {
    const rawFollowUpQuestion = rawValue.followUpQuestion;
    const unsafeReason = getUnsafeCoachTextReason(rawFollowUpQuestion, "follow_up_too_long");

    if (unsafeReason) {
      return { evaluation: null, fallbackReason: unsafeReason };
    }

    const followUpQuestion = typeof rawFollowUpQuestion === "string" ? rawFollowUpQuestion.trim() : "";

    if (getQuestionMarkCount(followUpQuestion) > 1) {
      return { evaluation: null, fallbackReason: "multiple_questions" };
    }

    if (!followUpQuestion.endsWith("?")) {
      return { evaluation: null, fallbackReason: "missing_question_mark" };
    }

    const misconceptionFollowUpQuestion =
      guardedAnalysis.misconceptionRisk !== "none"
        ? getMisconceptionFollowUpQuestion(
            guardedAnalysis.misconceptionRisk,
            fallback.lessonFocus,
          )
        : null;
    const safeFollowUpQuestion = didRemoveMisconceptionRisk
      ? (fallback.followUpQuestion ?? followUpQuestion)
      : misconceptionFollowUpQuestion &&
          !hasMisconceptionClarification(
            followUpQuestion,
            guardedAnalysis.misconceptionRisk,
          )
        ? misconceptionFollowUpQuestion
        : followUpQuestion;

    return {
      evaluation: {
        ...localEvaluationBase,
        followUpQuestion: safeFollowUpQuestion,
      },
    };
  }

  const rawPositiveMessage = rawValue.positiveMessage;
  const unsafeReason = getUnsafeCoachTextReason(rawPositiveMessage, "positive_message_too_long");

  if (unsafeReason) {
    return { evaluation: null, fallbackReason: unsafeReason };
  }

  const positiveMessage = typeof rawPositiveMessage === "string" ? rawPositiveMessage.trim() : "";

  if (getQuestionMarkCount(positiveMessage) > 0) {
    return { evaluation: null, fallbackReason: "positive_message_contains_question" };
  }

  const misconceptionClarificationMessage =
    guardedAnalysis.misconceptionRisk !== "none"
      ? getMisconceptionClarificationMessage(guardedAnalysis.misconceptionRisk)
      : null;
  const safePositiveMessage = didRemoveMisconceptionRisk
    ? (fallback.positiveMessage ?? positiveMessage)
    : misconceptionClarificationMessage &&
        !hasMisconceptionClarification(
          positiveMessage,
          guardedAnalysis.misconceptionRisk,
        )
      ? misconceptionClarificationMessage
      : positiveMessage;

  return {
    evaluation: {
      ...localEvaluationBase,
      positiveMessage: safePositiveMessage,
    },
  };
};

export async function evaluateReflectionWithAi(
  input: AiReflectionCoachInput,
): Promise<ReflectionCoachAiResult> {
  const apiKey = process.env.REFLECTION_COACH_API_KEY?.trim();
  const model = process.env.REFLECTION_COACH_MODEL?.trim();
  const url = getConfiguredChatCompletionsUrl();

  if (!apiKey || !model || !url) {
    return { evaluation: null, fallbackReason: "missing_config" };
  }

  if (!input.reflectionText.trim()) {
    return { evaluation: null, fallbackReason: "empty_reflection" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: getMessages(input),
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 520,
      }),
    });

    if (!response.ok) {
      return { evaluation: null, fallbackReason: "provider_http_error" };
    }

    const payload = (await response.json()) as OpenAiChatCompletionResponse;
    const content = extractContent(payload);

    if (!content || content.length > MAX_PROVIDER_RESPONSE_CHARS) {
      return {
        evaluation: null,
        fallbackReason: content ? "output_too_long" : "missing_message_content",
      };
    }

    const parsedContent = parseJsonObjectFromContent(content);

    if (parsedContent.fallbackReason) {
      return { evaluation: null, fallbackReason: parsedContent.fallbackReason };
    }

    return validateReflectionCoachAiEvaluation(
      parsedContent.value,
      input.localEvaluation,
      input.reflectionText,
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `${getProviderName()} reflection coach AI request failed.`,
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return { evaluation: null, fallbackReason: "provider_http_error" };
  }
}
