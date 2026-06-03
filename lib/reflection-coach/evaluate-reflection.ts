import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
  ReflectionCoachEvaluationInput,
  ReflectionCoachFocus,
  ReflectionCoachRecommendedFocus,
} from "@/lib/reflection-coach/types";

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

const hasPattern = (normalizedValue: string, pattern: RegExp) => pattern.test(normalizedValue);

const getMiniSiteMissingCategoryQuestion = (missingCategories: Array<"HTML" | "CSS" | "JavaScript">) => {
  if (missingCategories.length > 1) {
    return "Can you name one thing you changed in HTML, CSS, and JavaScript?";
  }

  return `What did you customize with ${missingCategories[0]}?`;
};

const getProjectSpecificEvaluation = ({
  projectSlug,
  reflectionPrompt,
  normalizedValue,
}: {
  projectSlug?: string;
  reflectionPrompt?: string;
  normalizedValue: string;
}): Pick<
  ReflectionCoachEvaluation,
  "coachResult" | "recommendedFocus" | "lessonFocus" | "followUpQuestion" | "positiveMessage"
> | null => {
  if (!projectSlug) {
    return null;
  }

  if (projectSlug === "all-about-me") {
    const hasHtmlChange = hasPattern(
      normalizedValue,
      /\b(changed|added|customized|updated|wrote|made|edited)\b.*\b(html|heading|title|paragraph|list|item|text|image|content|intro|h1|p|li)\b/,
    );
    const hasVisibleResult = hasPattern(
      normalizedValue,
      /\b(show|shows|showed|say|says|said|display|displays|appears|appeared|page|visitor|see|added)\b/,
    );

    if (!hasHtmlChange) {
      return {
        coachResult: "weak",
        recommendedFocus: "specificity",
        lessonFocus: "html",
        followUpQuestion: "What HTML part did you change, like a heading, paragraph, or list item?",
      };
    }

    if (!hasVisibleResult) {
      return {
        coachResult: "weak",
        recommendedFocus: "causality",
        lessonFocus: "html",
        followUpQuestion: "What did that change add or show on your page?",
      };
    }

    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "html",
      positiveMessage: "Nice work — you named an HTML change and what it did on the page.",
    };
  }

  if (projectSlug === "vibe-page") {
    const hasStyleChange = hasPattern(
      normalizedValue,
      /\b(changed|added|customized|updated|made|styled|picked|set)\b.*\b(css|style|color|background|font|text|spacing|card|border|size|theme|mood)\b/,
    );
    const hasCssTargeting = hasPattern(
      normalizedValue,
      /\b(selector|class|element|tag|id|target|targeted)\b|\.[a-z0-9_-]+|#[a-z0-9_-]+/,
    );

    if (!hasStyleChange) {
      return {
        coachResult: "weak",
        recommendedFocus: "specificity",
        lessonFocus: "css",
        followUpQuestion: "What style did you change, like a color, text, spacing, or card style?",
      };
    }

    if (!hasCssTargeting) {
      return {
        coachResult: "weak",
        recommendedFocus: "concept_connection",
        lessonFocus: "css",
        followUpQuestion: "What selector, class, or element helped CSS find that part of the page?",
      };
    }

    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "css",
      positiveMessage: "Nice work — you connected a CSS style change to how CSS found the page part.",
    };
  }

  if (projectSlug === "mood-switch") {
    const hasEvent = hasPattern(
      normalizedValue,
      /\b(click|clicked|press|pressed|tap|tapped|button|event|action|when i|when the user)\b/,
    );
    const hasPageResult = hasPattern(
      normalizedValue,
      /\b(message|text|mood|color|background|class|part|switch|show|shows|reacted)\b/,
    );

    if (!hasEvent) {
      return {
        coachResult: "weak",
        recommendedFocus: "causality",
        lessonFocus: "javascript",
        followUpQuestion: "What action made the JavaScript run?",
      };
    }

    if (!hasPageResult) {
      return {
        coachResult: "weak",
        recommendedFocus: "specificity",
        lessonFocus: "javascript",
        followUpQuestion: "What changed on the page after that action?",
      };
    }

    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "javascript",
      positiveMessage: "Nice work — you connected the action to the page change.",
    };
  }

  if (projectSlug === "build-your-own-mini-site") {
    const hasHtml = hasPattern(normalizedValue, /\b(html|heading|title|paragraph|list|image|text|content)\b/);
    const hasCss = hasPattern(normalizedValue, /\b(css|style|color|background|font|spacing|border|theme|card)\b/);
    const hasJavaScript = hasPattern(
      normalizedValue,
      /\b(javascript|js|button|click|clicked|message|mood|interaction|react|reacted)\b/,
    );
    const missingCategories = [
      hasHtml ? null : "HTML",
      hasCss ? null : "CSS",
      hasJavaScript ? null : "JavaScript",
    ].filter((category): category is "HTML" | "CSS" | "JavaScript" => Boolean(category));

    if (missingCategories.length > 0) {
      return {
        coachResult: "weak",
        recommendedFocus: "concept_connection",
        lessonFocus: "general",
        followUpQuestion: getMiniSiteMissingCategoryQuestion(missingCategories),
      };
    }

    if (reflectionPrompt?.toLowerCase().includes("proud") && !hasPattern(normalizedValue, /\b(because|why|proud|chose|wanted|so that)\b/)) {
      return {
        coachResult: "weak",
        recommendedFocus: "ownership",
        lessonFocus: "general",
        followUpQuestion: "Which change are you most proud of, and why?",
      };
    }

    return {
      coachResult: "strong",
      recommendedFocus: "ownership",
      lessonFocus: "general",
      positiveMessage: "Nice work — you covered what you customized in HTML, CSS, and JavaScript.",
    };
  }

  return null;
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
  const projectSpecificEvaluation = getProjectSpecificEvaluation({
    projectSlug,
    reflectionPrompt,
    normalizedValue,
  });

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
