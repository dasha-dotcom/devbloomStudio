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

const hasCssTargetingSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(selector|class|element|tag|id|target|targeted)\b|\.[a-z0-9_-]+|#[a-z0-9_-]+/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(because|used|using|select|selected|rule|find|found|knew)\b.{0,80}\b(body|main|h1|h2|p|li|ul|heading|title|card|hero title|vibe card|mood note|hero text|vibe list)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(body|main|h1|h2|p|li|ul|hero-title|vibe-card|mood-note|hero-text|vibe-list)\s+rule\b/,
  );

const getMiniSiteMissingCategoryQuestion = (missingCategories: Array<"HTML" | "CSS" | "JavaScript">) => {
  if (missingCategories.length > 1) {
    return "Can you name one thing you changed in HTML, CSS, and JavaScript?";
  }

  return `What did you customize with ${missingCategories[0]}?`;
};

const hasMiniSiteHtmlDetail = (normalizedValue: string) =>
  hasPattern(normalizedValue, /\b(heading|title|paragraph|list|image|text|content|intro|h1|p|li)\b/);

const hasMiniSiteCssDetail = (normalizedValue: string) =>
  hasPattern(normalizedValue, /\b(css|style|styles|color|colors|background|font|spacing|border|theme|card)\b/);

const hasMiniSiteJavaScriptDetail = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(button|click|clicked|message|mood|interaction|javascript|js|react|reacted)\b/,
  );

const getProjectSpecificEvaluation = ({
  projectSlug,
  normalizedValue,
}: {
  projectSlug?: string;
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
      /\b(show|shows|showed|say|says|said|display|displays|appears|appeared|visitor|see)\b/,
    );

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
  }

  if (projectSlug === "vibe-page") {
    const hasStyleChange = hasPattern(
      normalizedValue,
      /\b(changed|added|customized|updated|made|styled|picked|set)\b.*\b(css|style|color|background|font|text|spacing|card|border|size|theme|mood)\b/,
    );
    const hasCssTargeting = hasCssTargetingSignal(normalizedValue);
    const hasVisibleDesignResult = hasPattern(
      normalizedValue,
      /\b(page|look|looks|looked|feel|feels|felt|mood|calm|calmer|bright|brighter|design|different|visitor|see)\b/,
    );

    if (hasStyleChange && (hasCssTargeting || hasVisibleDesignResult)) {
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
        followUpQuestion: "What selector, class, or page result helped Sprout understand that CSS change?",
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

    return {
      coachResult: "weak",
      recommendedFocus: "specificity",
      lessonFocus: "css",
      followUpQuestion: "What style did you change, like a color, text, spacing, or card style?",
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
  }

  if (projectSlug === "build-your-own-mini-site") {
    const hasHtml = hasMiniSiteHtmlDetail(normalizedValue);
    const hasCss = hasMiniSiteCssDetail(normalizedValue);
    const hasJavaScript = hasMiniSiteJavaScriptDetail(normalizedValue);
    const missingCategories = [
      hasHtml ? null : "HTML",
      hasCss ? null : "CSS",
      hasJavaScript ? null : "JavaScript",
    ].filter((category): category is "HTML" | "CSS" | "JavaScript" => Boolean(category));

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
