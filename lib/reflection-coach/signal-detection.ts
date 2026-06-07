import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachRecommendedFocus,
} from "./types";

const hasPattern = (normalizedValue: string, pattern: RegExp) => pattern.test(normalizedValue);

export const hasHtmlContentChangeSignal = (normalizedValue: string) =>
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

export const hasVisiblePageResultSignal = (normalizedValue: string) =>
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

export const hasCssStyleChangeSignal = (normalizedValue: string) =>
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

export const hasCssVisibleDesignResultSignal = (normalizedValue: string) =>
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

export const hasImpliedCssVisibleResultSignal = (normalizedValue: string) =>
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

export const hasCssTargetingSignal = (normalizedValue: string) =>
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

export const hasJavaScriptActionSignal = (normalizedValue: string) =>
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

export const hasJavaScriptPageResultSignal = (normalizedValue: string) =>
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

export const getDetectedSignals = (normalizedValue: string): ReflectionCoachDetectedSignals => ({
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

export const getRecommendedFocus = (
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
