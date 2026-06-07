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
  hasSpecificEdit:
    hasHtmlContentChangeSignal(normalizedValue) ||
    hasCssStyleChangeSignal(normalizedValue) ||
    hasJavaScriptActionSignal(normalizedValue) ||
    hasJavaScriptPageResultSignal(normalizedValue),
  hasPageDetail:
    hasVisiblePageResultSignal(normalizedValue) ||
    hasCssVisibleDesignResultSignal(normalizedValue) ||
    hasJavaScriptPageResultSignal(normalizedValue),
  hasActionOrChange:
    hasHtmlContentChangeSignal(normalizedValue) ||
    hasCssStyleChangeSignal(normalizedValue) ||
    hasCssTargetingSignal(normalizedValue) ||
    hasJavaScriptActionSignal(normalizedValue) ||
    hasJavaScriptPageResultSignal(normalizedValue),
  hasConceptConnection:
    hasHtmlContentChangeSignal(normalizedValue) ||
    hasCssStyleChangeSignal(normalizedValue) ||
    hasCssTargetingSignal(normalizedValue) ||
    hasJavaScriptActionSignal(normalizedValue) ||
    hasJavaScriptPageResultSignal(normalizedValue),
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

const hasHtmlContentChangeSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(changed|added|customized|updated|wrote|made|edited|put|typed|set)\b.{0,80}\b(heading|title|big words|words|text|writing|paragraph|list|item|image|picture|photo|link|topic|name|favorite|about me|content|intro|h1|p|li)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(changed|made|updated|edited|set|wrote)\b.{0,50}\b(page|it)\b.{0,40}\b(say|says|show|shows|about)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(changed|updated|edited)\b.{0,40}\b(what it says|what the page says|the writing)\b/,
  );

const hasVisiblePageResultSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(now|after|then)\b.{0,50}\b(page|it|you)\b.{0,50}\b(show|shows|showed|say|says|said|display|displayed|appeared|has|see|about)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(page|it|you)\b.{0,50}\b(show|shows|showed|say|says|said|display|displayed|appeared|has|see)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(the\s+)?(big words|heading|title|page|my page)\b.{0,30}\b(say|says|show|shows)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bnow\b.{0,30}\b(it|the page|my page)\b.{0,30}\b(say|says|show|shows)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(to say|to show|made my page show|made the page show|made my page about|made the page about|changed on the page|page changed to|displayed|appeared)\b/,
  );

const hasCssStyleChangeSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(changed|added|customized|updated|made|styled|picked|set|chose)\b.{0,80}\b(css|style|styles|color|colors|background|font|size|spacing|margin|padding|border|rounded|round|corners|card|layout|design|look|looks|big|bigger|pink|purple|blue|green|red|orange|yellow|black|white|calm|calmer|happy|happier|cute|cuter|cool|cooler|pretty|prettier)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(it|the page|my page|card|background)\b.{0,40}\b(pink|purple|blue|green|red|orange|yellow|black|white|calm|calmer|happy|happier|cute|cuter|cool|cooler|pretty|prettier)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(words|text|letters|heading)\b.{0,30}\b(big|bigger)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(card|box)\b.{0,30}\b(round|rounded)\b/,
  ) ||
  hasPattern(normalizedValue, /\brounded\b.{0,30}\b(corner|corners)\b/) ||
  hasPattern(normalizedValue, /\bstyled\b.{0,40}\b(card|page|background|text|heading|button)\b/);

const hasCssVisibleDesignResultSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(look|looks|looked|feel|feels|felt)\b.{0,50}\b(calm|calmer|happy|happier|cute|cuter|cool|cooler|pretty|prettier|different|better|bright|brighter)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(words|text|letters|heading)\b.{0,20}\b(are|is|look|looks)\b.{0,20}\b(big|bigger)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(card|box|corners)\b.{0,20}\b(are|is|look|looks)\b.{0,20}\b(round|rounded)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(made|changed)\b.{0,50}\b(page|it|design)\b.{0,50}\b(look|looks|looked|feel|feels|felt|design)\b/,
  );

const hasImpliedCssVisibleResultSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(changed|added|updated|made|set|picked|chose)\b.{0,50}\b(background color|background|border|rounded|round|corners|layout|font size|text size|spacing|margin|padding)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(it|the page|my page|card|background)\b.{0,40}\b(pink|purple|blue|green|red|orange|yellow|black|white|calm|calmer|happy|happier|cute|cuter|cool|cooler|pretty|prettier)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(words|text|letters|heading)\b.{0,30}\b(big|bigger)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\bmade\b.{0,30}\b(card|box)\b.{0,30}\b(round|rounded)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\brounded\b.{0,30}\b(corner|corners)\b/,
  );

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

const hasJavaScriptActionSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(when|after)\b.{0,40}\b(click|clicked|press|pressed|tap|tapped|button|user clicks|event|ran|started)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(i|we|user|visitor)\b.{0,20}\b(click|clicked|press|pressed|tap|tapped)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(button)\b.{0,40}\b(made|makes|changed|changes|show|shows|ran|started|is clicked|gets clicked)\b/,
  ) ||
  hasPattern(normalizedValue, /\b(event|ran|started|interactive)\b/);

const hasJavaScriptPageResultSignal = (normalizedValue: string) =>
  hasPattern(
    normalizedValue,
    /\b(message|text|words|button message|mood|page|part)\b.{0,50}\b(changed|changes|showed|shows|appeared|appears|switched|switches)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(changed|changes|showed|shows|said|says|displayed|appeared|hid|hide|hides)\b.{0,50}\b(message|text|words|mood|page|part|surprise|something different|new message)\b/,
  ) ||
  hasPattern(
    normalizedValue,
    /\b(said something different|showed a new message|shows a new message|new mood show|new mood shows|surprise appeared|surprise appears|showed something|hid something|shows a new mood)\b/,
  );

const getMiniSiteCategorySignals = (normalizedValue: string) => ({
  hasHtml: hasHtmlContentChangeSignal(normalizedValue),
  hasCss: hasCssStyleChangeSignal(normalizedValue),
  hasJavaScript:
    hasJavaScriptActionSignal(normalizedValue) || hasJavaScriptPageResultSignal(normalizedValue),
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
    const hasHtmlChange = hasHtmlContentChangeSignal(normalizedValue);
    const hasVisibleResult = hasVisiblePageResultSignal(normalizedValue);

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
    const hasStyleChange = hasCssStyleChangeSignal(normalizedValue);
    const hasCssTargeting = hasCssTargetingSignal(normalizedValue);
    const hasVisibleDesignResult = hasCssVisibleDesignResultSignal(normalizedValue);
    const hasImpliedVisibleResult = hasImpliedCssVisibleResultSignal(normalizedValue);

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
  }

  if (projectSlug === "mood-switch") {
    const hasEvent = hasJavaScriptActionSignal(normalizedValue);
    const hasPageResult = hasJavaScriptPageResultSignal(normalizedValue);

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
    const { hasHtml, hasCss, hasJavaScript } = getMiniSiteCategorySignals(normalizedValue);
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
