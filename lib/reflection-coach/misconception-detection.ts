import type {
  ReflectionCoachAiAnalysis,
  ReflectionCoachAiMisconceptionRisk,
  ReflectionCoachEvaluation,
  ReflectionCoachFocus,
} from "./types";

type MisconceptionDetectionInput = {
  normalizedValue?: string;
  reflectionText?: string;
  projectSlug?: string;
  lessonFocus: ReflectionCoachFocus;
  misconceptionNote?: string;
};

const htmlCssStyleWordPattern =
  /\b(background color|background|color|colors|theme|font|size|border|spacing|layout|rounded|round|margin|padding|style|styles|pink|purple|green|blue|red|yellow|orange|black|white|gray|grey|brown|big|bigger|small|smaller)\b/;
const customizationActionPattern =
  /\b(changed|changes|made|makes|customized|customizes|updated|updates|set|sets|picked|picks|chose|chooses|edited|edits|wrote|put|puts|added|adds)\b/;
const javascriptAttributionPattern =
  /\b(javascript|js)\b.{0,100}\b(changed|changes|made|makes|updated|updates|set|sets|edited|edits|customized|customizes|put|puts|added|adds)\b|\b(changed|changes|made|makes|updated|updates|set|sets|edited|edits|customized|customizes|put|puts|added|adds)\b.{0,100}\b(javascript|js)\b/;
const htmlContentWordPattern =
  /\b(heading|headings|title|titles|paragraph|paragraphs|words|text|writing|image|images|picture|pictures|link|links|list|lists|list item|items|page content|content|page says|page said|say|says|topic|about me)\b/;
const cssAttributionPattern =
  /\bcss\b.{0,100}\b(made|makes|caused|causes|let|lets|helped|helps|handled|handles|controlled|controls|changed|changes|ran|runs|run|started|starts)\b|\b(made|makes|caused|causes|let|lets|helped|helps|handled|handles|controlled|controls|changed|changes|ran|runs|run|started|starts)\b.{0,100}\bcss\b/;
const javascriptBehaviorWordPattern =
  /\b(click|clicked|clicks|press|pressed|presses|show|shows|showed|hide|hides|hid|alert|alerts|interactive|interaction|interactions|action|actions|react|reacts|run|runs|ran|started|starts)\b|\b(message|messages|mood|moods)\b.{0,40}\b(change|changed|changes|different|new|show|shows|showed|appeared)\b|\b(change|changed|changes|show|shows|showed)\b.{0,40}\b(message|messages|mood|moods)\b|\bbutton\b.{0,40}\b(message|messages|change|changed|changes|show|shows|showed|hide|hides|hid|alert|react|reacts|run|runs)\b/;
const cssStyleOnlyTargetPattern =
  /\b(button|message|messages)\s+(color|colors|font|size|style|styles|background|border)\b|\b(color|colors|font|size|style|styles|background|border)\s+(of|for)?\s*(the\s+)?(button|message|messages)\b/;
const cssJavascriptNotePattern =
  /\bcss\b.{0,100}\b(javascript|js|functionality|interaction|button|click|message|action)\b|\b(javascript|js|functionality|interaction|button|click|message|action)\b.{0,100}\bcss\b/;
const htmlJavascriptNotePattern =
  /\b(html|heading|headings|title|titles|words|text|content|page parts)\b.{0,100}\b(javascript|js)\b|\b(javascript|js)\b.{0,100}\b(html|heading|headings|title|titles|words|text|content|page parts)\b/;
const actionEventWordPattern =
  /\b(click|clicked|clicks|press|pressed|presses|tap|tapped|button|event|action|when|after)\b/;

const getNormalizedValue = ({ normalizedValue, reflectionText }: MisconceptionDetectionInput) =>
  normalizedValue ?? reflectionText?.toLowerCase() ?? "";

const hasDeterministicHtmlCssConfusion = (input: MisconceptionDetectionInput) => {
  const normalizedReflection = getNormalizedValue(input);
  const hasHtmlLessonStyleChange =
    input.lessonFocus === "html" &&
    customizationActionPattern.test(normalizedReflection) &&
    htmlCssStyleWordPattern.test(normalizedReflection);
  const clauses = normalizedReflection.split(
    /\s*(?:[.;]|\band\b|\bbut\b|,\s*(?=(?:with\s+|in\s+)?(?:html|css|javascript|js)\b))\s*/,
  );

  return hasHtmlLessonStyleChange || clauses.some(
    (clause) =>
      (/\b(with html|html)\b/.test(clause) &&
        customizationActionPattern.test(clause) &&
        htmlCssStyleWordPattern.test(clause)) ||
      (input.lessonFocus === "html" &&
        /\bcss\b/.test(clause) &&
        customizationActionPattern.test(clause) &&
        htmlContentWordPattern.test(clause) &&
        !htmlCssStyleWordPattern.test(clause)),
  );
};

const hasDeterministicCssJsConfusion = (input: MisconceptionDetectionInput) => {
  const normalizedReflection = getNormalizedValue(input);
  const noteImpliesCssJsConfusion =
    input.misconceptionNote !== undefined &&
    cssJavascriptNotePattern.test(input.misconceptionNote.toLowerCase());

  return (
    (input.lessonFocus === "javascript" || noteImpliesCssJsConfusion) &&
    cssAttributionPattern.test(normalizedReflection) &&
    javascriptBehaviorWordPattern.test(normalizedReflection) &&
    !cssStyleOnlyTargetPattern.test(normalizedReflection)
  );
};

const hasDeterministicHtmlJsConfusion = (input: MisconceptionDetectionInput) => {
  const normalizedReflection = getNormalizedValue(input);
  const noteImpliesHtmlJsConfusion =
    input.misconceptionNote !== undefined &&
    htmlJavascriptNotePattern.test(input.misconceptionNote.toLowerCase());

  return (
    (input.lessonFocus === "html" || noteImpliesHtmlJsConfusion) &&
    javascriptAttributionPattern.test(normalizedReflection) &&
    htmlContentWordPattern.test(normalizedReflection) &&
    !actionEventWordPattern.test(normalizedReflection)
  );
};

const hasDeterministicEventResultConfusion = (input: MisconceptionDetectionInput) => {
  void input;
  return false;
};

const isMisconceptionRiskSupportedByReflection = (
  input: MisconceptionDetectionInput,
  risk: ReflectionCoachAiMisconceptionRisk,
) => {
  if (risk === "html_css_confusion") {
    return hasDeterministicHtmlCssConfusion(input);
  }

  if (risk === "html_js_confusion") {
    return hasDeterministicHtmlJsConfusion(input);
  }

  if (risk === "css_js_confusion") {
    return hasDeterministicCssJsConfusion(input);
  }

  if (risk === "event_result_confusion") {
    return hasDeterministicEventResultConfusion(input);
  }

  return true;
};

const isGuardedMisconceptionRisk = (risk: ReflectionCoachAiMisconceptionRisk) =>
  risk === "html_css_confusion" ||
  risk === "html_js_confusion" ||
  risk === "css_js_confusion" ||
  risk === "event_result_confusion";

export const detectLocalMisconceptionRisk = (
  input: MisconceptionDetectionInput,
): ReflectionCoachAiMisconceptionRisk => {
  if (hasDeterministicHtmlCssConfusion(input)) {
    return "html_css_confusion";
  }

  if (hasDeterministicHtmlJsConfusion(input)) {
    return "html_js_confusion";
  }

  if (hasDeterministicCssJsConfusion(input)) {
    return "css_js_confusion";
  }

  if (hasDeterministicEventResultConfusion(input)) {
    return "event_result_confusion";
  }

  return "none";
};

export const getMisconceptionClarificationMessage = (
  risk: ReflectionCoachAiMisconceptionRisk,
) => {
  if (risk === "html_css_confusion") {
    return "Nice start — one small fix: HTML changes page parts and words, while CSS changes styles and how those parts look.";
  }

  if (risk === "html_js_confusion") {
    return "Nice start — one small fix: changing heading text is an HTML/content change. JavaScript usually runs after an action, like a button click.";
  }

  if (risk === "css_js_confusion") {
    return "Nice start — one small fix: CSS changes how things look. JavaScript makes button clicks change messages.";
  }

  if (risk === "event_result_confusion") {
    return "Nice start — one small fix: say what action happened and what changed on the page after it.";
  }

  if (risk === "other") {
    return "Nice start — one small fix: add the coding idea that explains what changed on your page.";
  }

  return null;
};

export const getMisconceptionFollowUpQuestion = (
  risk: ReflectionCoachAiMisconceptionRisk,
  lessonFocus: ReflectionCoachFocus,
) => {
  if (risk === "html_css_confusion") {
    if (lessonFocus === "html") {
      return "Good start — one small fix: HTML changes page parts and words. CSS changes styles and how those parts look. What HTML part did you change?";
    }

    return "Good start — one small fix: CSS changes styles like background colors, while HTML adds page parts and words. What CSS style did you change?";
  }

  if (risk === "html_js_confusion") {
    return "Good start — one small fix: HTML changes page parts and words, while JavaScript usually runs after an action. What HTML/content part did you change?";
  }

  if (risk === "css_js_confusion") {
    return "Good start — one small fix: CSS changes how things look. JavaScript makes button clicks change messages. What happened when you clicked the button?";
  }

  if (risk === "event_result_confusion") {
    return "Good start — one small fix: say what action happened and what changed on the page after it. What happened after the action?";
  }

  if (risk === "other") {
    return "Good start — one small fix: add the coding idea that explains your page change. What coding idea should Sprout notice?";
  }

  return null;
};

export const hasMisconceptionClarification = (
  message: string,
  risk: ReflectionCoachAiMisconceptionRisk,
) => {
  const normalizedMessage = message.toLowerCase();

  if (risk === "html_css_confusion") {
    return (
      /\bhtml\b/.test(normalizedMessage) &&
      /\bcss\b/.test(normalizedMessage) &&
      /\b(style|styles|background|color|colors|page parts|words|content)\b/.test(
        normalizedMessage,
      )
    );
  }

  if (risk === "html_js_confusion") {
    return (
      /\bhtml\b/.test(normalizedMessage) &&
      /\b(javascript|js)\b/.test(normalizedMessage) &&
      /\b(react|interaction|action|button|click|parts|heading|words|content|page)\b/.test(
        normalizedMessage,
      )
    );
  }

  if (risk === "css_js_confusion") {
    return (
      /\bcss\b/.test(normalizedMessage) &&
      /\b(javascript|js)\b/.test(normalizedMessage) &&
      /\b(look|looks|style|styles|button|click|clicked|message|run|runs|action|interaction)\b/.test(
        normalizedMessage,
      )
    );
  }

  if (risk === "event_result_confusion") {
    return (
      /\b(action|event|click|clicked|button|press|pressed)\b/.test(normalizedMessage) &&
      /\b(result|changed|message|page|after|showed|shows)\b/.test(normalizedMessage)
    );
  }

  if (risk === "other") {
    return /\b(fix|clarify|remember|coding idea|one small)\b/.test(normalizedMessage);
  }

  return true;
};

const getMisconceptionNote = (risk: ReflectionCoachAiMisconceptionRisk) => {
  if (risk === "html_css_confusion") {
    return "Student may be attributing a CSS style change to HTML.";
  }

  if (risk === "html_js_confusion") {
    return "Student may be attributing a direct HTML/content change to JavaScript.";
  }

  if (risk === "css_js_confusion") {
    return "Student may be attributing JavaScript button behavior to CSS.";
  }

  if (risk === "event_result_confusion") {
    return "Student may need help connecting the JavaScript action and page result.";
  }

  if (risk === "other") {
    return "Student may need a brief clarification about the coding idea.";
  }

  return undefined;
};

const getAnalysisSpecificity = (
  evaluation: ReflectionCoachEvaluation,
): ReflectionCoachAiAnalysis["specificity"] => {
  if (evaluation.coachResult === "empty") {
    return "empty";
  }

  if (evaluation.coachResult === "weak") {
    return "generic";
  }

  if (evaluation.coachResult === "almost_there") {
    return "somewhat_specific";
  }

  return "specific";
};

const getAnalysisPersonalization = (
  evaluation: ReflectionCoachEvaluation,
): ReflectionCoachAiAnalysis["personalization"] => {
  if (evaluation.coachResult === "empty") {
    return "none";
  }

  if (evaluation.detectedSignals.hasCopiedExample) {
    return "generic_example";
  }

  return evaluation.coachResult === "strong"
    ? "clearly_personalized"
    : "some_personal_detail";
};

export const applyDeterministicMisconceptionGuard = ({
  analysis,
  reflectionText,
  lessonFocus,
}: {
  analysis: ReflectionCoachAiAnalysis;
  reflectionText: string;
  lessonFocus: ReflectionCoachFocus;
}): ReflectionCoachAiAnalysis => {
  const detectionInput = {
    reflectionText,
    lessonFocus,
    misconceptionNote: analysis.misconceptionNote,
  };
  const misconceptionRisk = detectLocalMisconceptionRisk(detectionInput);

  if (misconceptionRisk === "none") {
    if (
      isGuardedMisconceptionRisk(analysis.misconceptionRisk) &&
      !isMisconceptionRiskSupportedByReflection(detectionInput, analysis.misconceptionRisk)
    ) {
      const analysisWithoutNote: ReflectionCoachAiAnalysis = {
        ...analysis,
        misconceptionRisk: "none",
      };
      delete analysisWithoutNote.misconceptionNote;

      return analysisWithoutNote;
    }

    return analysis;
  }

  return {
    ...analysis,
    misconceptionRisk,
    misconceptionNote: analysis.misconceptionNote ?? getMisconceptionNote(misconceptionRisk),
  };
};

export const applyLocalMisconceptionOverlay = ({
  evaluation,
  reflectionText,
  projectSlug,
}: {
  evaluation: ReflectionCoachEvaluation;
  reflectionText: string;
  projectSlug?: string;
}): ReflectionCoachEvaluation => {
  const misconceptionRisk = detectLocalMisconceptionRisk({
    normalizedValue: reflectionText.toLowerCase(),
    reflectionText,
    projectSlug,
    lessonFocus: evaluation.lessonFocus,
  });

  if (misconceptionRisk === "none" || evaluation.coachResult === "empty") {
    return evaluation;
  }

  const misconceptionNote = getMisconceptionNote(misconceptionRisk);
  const analysis: ReflectionCoachAiAnalysis = {
    specificity: getAnalysisSpecificity(evaluation),
    personalization: getAnalysisPersonalization(evaluation),
    misconceptionRisk,
    ...(misconceptionNote ? { misconceptionNote } : {}),
    copiedExampleRisk: evaluation.detectedSignals.hasCopiedExample ? "likely" : "none",
  };
  const teacherInsight = misconceptionNote;
  const clarificationMessage =
    evaluation.coachResult === "strong"
      ? getMisconceptionClarificationMessage(misconceptionRisk)
      : getMisconceptionFollowUpQuestion(misconceptionRisk, evaluation.lessonFocus);

  return {
    ...evaluation,
    analysis,
    ...(teacherInsight ? { teacherInsight } : {}),
    ...(evaluation.coachResult === "strong" && clarificationMessage
      ? { positiveMessage: clarificationMessage, followUpQuestion: undefined }
      : {}),
    ...(evaluation.coachResult !== "strong" && clarificationMessage
      ? { followUpQuestion: clarificationMessage, positiveMessage: undefined }
      : {}),
  };
};
