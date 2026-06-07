import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
  ReflectionCoachFallbackReason,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
} from "@/lib/reflection-coach/types";

type AiReflectionCoachInput = {
  projectSlug: string;
  projectTitle: string;
  lessonTitle?: string;
  reflectionPrompt?: string;
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
    };

const MAX_COACH_TEXT_LENGTH = 180;
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

const warnStatusMismatchInDevelopment = (
  mismatch: string,
  details: Record<string, unknown>,
) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Reflection coach AI status mismatch:", mismatch, details);
  }
};

const harshLanguagePattern = /\b(incorrect|insufficient)\b/i;
const codeLikeOutputPattern =
  /\b(paste|copy this|use this code|function|const|let|var|document\.|console\.)\b|[{}<>]/i;

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
        followUpQuestion:
          "Only if coachResult is weak or almost_there. Vary the wording, but ask only about authoritativeLocalEvaluation.followUpQuestion.",
        positiveMessage:
          "Only if coachResult is strong. Omit this field completely for weak, almost_there, and empty.",
      },
      rules: [
        "The authoritativeLocalEvaluation is final. Do not change coachResult, detectedSignals, recommendedFocus, or lessonFocus.",
        "If coachResult is weak or almost_there, write exactly one short follow-up question about the same missing idea as authoritativeLocalEvaluation.followUpQuestion.",
        "If coachResult is weak or almost_there, you may mention one detail the student wrote, but do not ask about a different missing idea.",
        "If coachResult is weak or almost_there, do not include positiveMessage.",
        "If coachResult is strong, give one short positive message and no follow-up question.",
        "If coachResult is empty, do not invent details.",
        "Never write a replacement reflection for the student.",
        "Never include code or coding instructions.",
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
      projectPromptTarget: getProjectPromptTarget(projectSlug),
      lessonFocus,
      lessonFocusMeaning: {
        html: "structure/content on the page",
        css: "style/look/feel",
        javascript: "interaction/reaction/click behavior",
        general: "project change/result",
      }[lessonFocus],
      studentReflection: reflectionText.slice(0, MAX_REFLECTION_CHARS_FOR_AI),
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

  if (harshLanguagePattern.test(trimmed)) {
    return "harsh_language";
  }

  if (codeLikeOutputPattern.test(trimmed)) {
    return "code_like_output";
  }

  return null;
};

const normalizeAiEvaluation = (
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
    warnStatusMismatchInDevelopment("empty reflection returned non-empty result", {
      aiCoachResult: coachResult,
      expectedCoachResult: "empty",
    });
    return { evaluation: null, fallbackReason: "status_mismatch" };
  }

  if (reflectionText.trim() && coachResult === "empty") {
    warnStatusMismatchInDevelopment("non-empty reflection returned empty result", {
      aiCoachResult: coachResult,
      localCoachResult: fallback.coachResult,
    });
    return { evaluation: null, fallbackReason: "status_mismatch" };
  }

  if (coachResult !== fallback.coachResult) {
    warnStatusMismatchInDevelopment("coachResult changed", {
      aiCoachResult: coachResult,
      localCoachResult: fallback.coachResult,
    });
    return { evaluation: null, fallbackReason: "status_mismatch" };
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
    warnStatusMismatchInDevelopment("authoritative fields changed", {
      aiDetectedSignals: detectedSignals,
      localDetectedSignals: fallback.detectedSignals,
      aiRecommendedFocus: recommendedFocus,
      localRecommendedFocus: fallback.recommendedFocus,
      aiLessonFocus: lessonFocus,
      localLessonFocus: fallback.lessonFocus,
    });
    return { evaluation: null, fallbackReason: "status_mismatch" };
  }

  const localEvaluationBase = {
    coachResult: fallback.coachResult,
    detectedSignals: fallback.detectedSignals,
    recommendedFocus: fallback.recommendedFocus,
    lessonFocus: fallback.lessonFocus,
  };

  if (coachResult === "empty") {
    if (rawValue.followUpQuestion !== undefined || rawValue.positiveMessage !== undefined) {
      warnStatusMismatchInDevelopment("empty result included coach message", {
        hasFollowUpQuestion: rawValue.followUpQuestion !== undefined,
        hasPositiveMessage: rawValue.positiveMessage !== undefined,
      });
      return { evaluation: null, fallbackReason: "status_mismatch" };
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

    return {
      evaluation: {
        ...localEvaluationBase,
        followUpQuestion,
      },
    };
  }

  const rawPositiveMessage = rawValue.positiveMessage;
  const unsafeReason = getUnsafeCoachTextReason(rawPositiveMessage, "positive_message_too_long");

  if (unsafeReason) {
    return { evaluation: null, fallbackReason: unsafeReason };
  }

  if (rawValue.followUpQuestion !== undefined) {
    warnStatusMismatchInDevelopment("strong result included follow-up question", {
      coachResult,
      hasFollowUpQuestion: true,
    });
    return { evaluation: null, fallbackReason: "status_mismatch" };
  }

  const positiveMessage = typeof rawPositiveMessage === "string" ? rawPositiveMessage.trim() : "";

  if (getQuestionMarkCount(positiveMessage) > 0) {
    return { evaluation: null, fallbackReason: "positive_message_contains_question" };
  }

  return {
    evaluation: {
      ...localEvaluationBase,
      positiveMessage,
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
        max_tokens: 140,
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

    return normalizeAiEvaluation(parsedContent.value, input.localEvaluation, input.reflectionText);
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
