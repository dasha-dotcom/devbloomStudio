import assert from "node:assert/strict";
import { test } from "node:test";

import notebookModule from "../../components/lesson/ai-reflection-coach-notebook.tsx";
import aiCoachClient from "./ai-coach-client.ts";
import reflectionEvaluator from "./evaluate-reflection.ts";
import misconceptionDetection from "./misconception-detection.ts";

const { normalizeCoachApiResponse } = notebookModule;
const { evaluateReflectionWithAi, validateReflectionCoachAiEvaluation } = aiCoachClient;
const { evaluateReflectionForCoach } = reflectionEvaluator;
const { applyLocalMisconceptionOverlay } = misconceptionDetection;

process.env.NODE_ENV = "production";

const validAnalysis = (overrides = {}) => ({
  specificity: "somewhat_specific",
  personalization: "some_personal_detail",
  misconceptionRisk: "none",
  inferredStudentUnderstanding: ["Named one page change"],
  missingConcepts: ["Visible result"],
  copiedExampleRisk: "none",
  ...overrides,
});

const getLocalEvaluation = (projectSlug, reflectionText) =>
  evaluateReflectionForCoach({
    projectSlug,
    reflectionText,
  });

const getMisconceptionAwareLocalEvaluation = (projectSlug, reflectionText) => {
  const localEvaluation = getLocalEvaluation(projectSlug, reflectionText);

  return applyLocalMisconceptionOverlay({
    evaluation: localEvaluation,
    reflectionText,
    projectSlug,
  });
};

const restoreEnvValue = (key, value) => {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
};

const getRawAiValue = (localEvaluation, overrides = {}) => ({
  coachResult: localEvaluation.coachResult,
  detectedSignals: localEvaluation.detectedSignals,
  recommendedFocus: localEvaluation.recommendedFocus,
  lessonFocus: localEvaluation.lessonFocus,
  analysis: validAnalysis(),
  ...(localEvaluation.coachResult === "strong"
    ? { positiveMessage: "Nice work — you connected your change to the page." }
    : {}),
  ...(localEvaluation.coachResult === "weak" || localEvaluation.coachResult === "almost_there"
    ? { followUpQuestion: "What changed on your own page?" }
    : {}),
  ...overrides,
});

test("valid AI analysis is accepted while local authoritative fields are preserved", () => {
  const localEvaluation = getLocalEvaluation("all-about-me", "I changed the heading.");
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      teacherInsight: "Student named a content change but not the visible result.",
    }),
    localEvaluation,
    "I changed the heading.",
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, localEvaluation.coachResult);
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(result.evaluation?.analysis?.specificity, "somewhat_specific");
  assert.equal(
    result.evaluation?.teacherInsight,
    "Student named a content change but not the visible result.",
  );
});

test("invalid or missing AI analysis falls back to local output", () => {
  const localEvaluation = getLocalEvaluation("all-about-me", "I changed the heading.");

  const invalidEnumResult = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({ copiedExampleRisk: "maybe" }),
    }),
    localEvaluation,
    "I changed the heading.",
  );
  assert.equal(invalidEnumResult.evaluation, null);
  assert.equal(invalidEnumResult.fallbackReason, "invalid_analysis");

  const missingAnalysisResult = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, { analysis: undefined }),
    localEvaluation,
    "I changed the heading.",
  );
  assert.equal(missingAnalysisResult.evaluation, null);
  assert.equal(missingAnalysisResult.fallbackReason, "invalid_analysis");
});

test("AI prompt requires the full analysis shape", async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.REFLECTION_COACH_API_KEY;
  const originalBaseUrl = process.env.REFLECTION_COACH_BASE_URL;
  const originalModel = process.env.REFLECTION_COACH_MODEL;
  const reflectionText =
    "I changed the title to Soccer Facts, the colors to green, and the button message to Go team.";
  const localEvaluation = getLocalEvaluation("build-your-own-mini-site", reflectionText);
  let requestBody;

  process.env.REFLECTION_COACH_API_KEY = "test-key";
  process.env.REFLECTION_COACH_BASE_URL = "https://example.test/v1";
  process.env.REFLECTION_COACH_MODEL = "test-model";
  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify(getRawAiValue(localEvaluation)),
            },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    const result = await evaluateReflectionWithAi({
      projectSlug: "build-your-own-mini-site",
      projectTitle: "Build Your Own Mini Site",
      reflectionPrompt:
        "In HTML, I customized ___. In CSS, I customized ___. In JavaScript, I customized ___.",
      reflectionPlaceholder:
        "Example: In HTML, I changed the title. In CSS, I changed the colors. In JavaScript, I changed the button message.",
      lessonFocus: localEvaluation.lessonFocus,
      reflectionText,
      localEvaluation,
    });

    assert.notEqual(result.evaluation, null);
    const userMessage = requestBody.messages.find((message) => message.role === "user");
    const promptText = userMessage.content;

    assert.match(promptText, /analysis is required in every response/i);
    assert.match(promptText, /Any response without analysis is invalid/i);
    assert.match(promptText, /requiredFinalJsonShape/i);
    assert.match(promptText, /specificity/i);
    assert.match(promptText, /personalization/i);
    assert.match(promptText, /misconceptionRisk/i);
    assert.match(promptText, /copiedExampleRisk/i);
    assert.match(promptText, /inferredStudentUnderstanding/i);
    assert.match(promptText, /missingConcepts/i);
    assert.match(promptText, /Use \[\] when there is nothing to add/i);
    assert.match(promptText, /misconceptionNote.*only when misconceptionRisk is not none/i);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvValue("REFLECTION_COACH_API_KEY", originalApiKey);
    restoreEnvValue("REFLECTION_COACH_BASE_URL", originalBaseUrl);
    restoreEnvValue("REFLECTION_COACH_MODEL", originalModel);
  }
});

test("AI cannot change local authoritative status fields", () => {
  const emptyLocal = getLocalEvaluation("all-about-me", "");
  const emptyUpgrade = validateReflectionCoachAiEvaluation(
    getRawAiValue(emptyLocal, {
      coachResult: "almost_there",
      followUpQuestion: "What did you change on your page?",
    }),
    emptyLocal,
    "",
  );
  assert.equal(emptyUpgrade.evaluation, null);
  assert.equal(emptyUpgrade.fallbackReason, "status_mismatch");

  const copiedLocal = getLocalEvaluation(
    "all-about-me",
    "I changed the heading, and it made my page show my topic.",
  );
  const copiedUpgrade = validateReflectionCoachAiEvaluation(
    getRawAiValue(copiedLocal, {
      coachResult: "almost_there",
      recommendedFocus: "specificity",
    }),
    copiedLocal,
    "I changed the heading, and it made my page show my topic.",
  );
  assert.equal(copiedUpgrade.evaluation, null);
  assert.equal(copiedUpgrade.fallbackReason, "status_mismatch");

  const weakLocal = getLocalEvaluation("vibe-page", "I did CSS.");
  const weakUpgrade = validateReflectionCoachAiEvaluation(
    getRawAiValue(weakLocal, {
      coachResult: "almost_there",
    }),
    weakLocal,
    "I did CSS.",
  );
  assert.equal(weakUpgrade.evaluation, null);
  assert.equal(weakUpgrade.fallbackReason, "status_mismatch");
});

test("unsafe or overlong student-facing AI messages are rejected", () => {
  const weakLocal = getLocalEvaluation("vibe-page", "I did CSS.");
  const unsafeFollowUps = [
    "```js\nconsole.log('hi')\n```?",
    '{"question":"What CSS style changed?"}?',
    "Traceback error: at run (file.js:1:2)?",
    "What changed?\nWhat else changed?",
    "Use the DOM API runtime execution context to explain this?",
  ];

  for (const followUpQuestion of unsafeFollowUps) {
    const result = validateReflectionCoachAiEvaluation(
      getRawAiValue(weakLocal, { followUpQuestion }),
      weakLocal,
      "I did CSS.",
    );
    assert.equal(result.evaluation, null);
  }

  const overlongFollowUp = validateReflectionCoachAiEvaluation(
    getRawAiValue(weakLocal, {
      followUpQuestion: `${"A".repeat(181)}?`,
    }),
    weakLocal,
    "I did CSS.",
  );
  assert.equal(overlongFollowUp.evaluation, null);
  assert.equal(overlongFollowUp.fallbackReason, "follow_up_too_long");

  const strongLocal = getLocalEvaluation(
    "all-about-me",
    "I changed the heading and it made my page show cats.",
  );
  const overlongPositive = validateReflectionCoachAiEvaluation(
    getRawAiValue(strongLocal, {
      positiveMessage: "A".repeat(181),
    }),
    strongLocal,
    "I changed the heading and it made my page show cats.",
  );
  assert.equal(overlongPositive.evaluation, null);
  assert.equal(overlongPositive.fallbackReason, "positive_message_too_long");
});

test("normal beginner coding terms are allowed in AI follow-up wording", () => {
  const localEvaluation = getLocalEvaluation("vibe-page", "I did CSS.");
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      followUpQuestion: "What CSS style, class, button, message, page, or heading changed?",
    }),
    localEvaluation,
    "I did CSS.",
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(
    result.evaluation?.followUpQuestion,
    "What CSS style, class, button, message, page, or heading changed?",
  );
});

test("local strong with safe misconception clarification keeps local result", () => {
  const reflectionText = "HTML changed the background color.";
  const localEvaluation = getLocalEvaluation("vibe-page", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        misconceptionRisk: "html_css_confusion",
        misconceptionNote: "Student may be attributing a style change to HTML.",
      }),
      positiveMessage:
        "Nice work — HTML adds page words, and CSS changes styles like background colors.",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "strong");
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "html_css_confusion");
  assert.equal(
    result.evaluation?.positiveMessage,
    "Nice work — HTML adds page words, and CSS changes styles like background colors.",
  );
});

test("local strong with misconception risk replaces generic positive message", () => {
  const localEvaluation = getLocalEvaluation("vibe-page", "HTML changed the background color.");
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        specificity: "generic",
        personalization: "none",
        misconceptionRisk: "html_css_confusion",
        misconceptionNote: "Student may be attributing a CSS style change to HTML.",
        missingConcepts: ["CSS targeting", "specific style change"],
      }),
      positiveMessage: "Nice work — you connected a CSS style change to how the page looked.",
    }),
    localEvaluation,
    "HTML changed the background color.",
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "strong");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "html_css_confusion");
  assert.match(result.evaluation?.positiveMessage ?? "", /CSS/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /HTML/i);
  assert.notEqual(
    result.evaluation?.positiveMessage,
    "Nice work — you connected a CSS style change to how the page looked.",
  );
});

test("obvious HTML style misconception is guarded when AI reports no misconception", () => {
  const reflectionText = "With HTML, I changed the background color and the theme to green";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        misconceptionRisk: "none",
      }),
      followUpQuestion: "What HTML part did you change, like a heading, paragraph, or list item?",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "weak");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, "specificity");
  assert.equal(result.evaluation?.lessonFocus, "html");
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "html_css_confusion");
  assert.match(result.evaluation?.followUpQuestion ?? "", /HTML/i);
  assert.match(result.evaluation?.followUpQuestion ?? "", /CSS/i);
  assert.match(result.evaluation?.followUpQuestion ?? "", /What HTML part did you change\?/i);
  assert.notEqual(
    result.evaluation?.followUpQuestion,
    "What HTML part did you change, like a heading, paragraph, or list item?",
  );
});

test("CSS and JavaScript misconception is routed to JavaScript-focused clarification", () => {
  const reflectionText = "CSS made the button change the message.";
  const localEvaluation = getLocalEvaluation("mood-switch", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        misconceptionRisk: "html_css_confusion",
        misconceptionNote: "The student seems to confuse CSS with JavaScript functionality.",
      }),
      followUpQuestion: "What CSS style did you change?",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "weak");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, "javascript");
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "css_js_confusion");
  assert.match(result.evaluation?.followUpQuestion ?? "", /CSS/i);
  assert.match(result.evaluation?.followUpQuestion ?? "", /JavaScript/i);
  assert.match(result.evaluation?.followUpQuestion ?? "", /button|click|message/i);
  assert.doesNotMatch(result.evaluation?.followUpQuestion ?? "", /HTML/i);
  assert.notEqual(result.evaluation?.followUpQuestion, "What CSS style did you change?");
});

test("HTML and JavaScript misconception is routed to content-action clarification", () => {
  const reflectionText = "JavaScript changed the heading to say cats";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        misconceptionRisk: "css_js_confusion",
        misconceptionNote: "The student may be confusing JavaScript with HTML changes.",
      }),
      positiveMessage:
        "Nice start — one small fix: CSS changes how things look, while JavaScript makes button clicks change messages.",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "strong");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, "html");
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "html_js_confusion");
  assert.match(result.evaluation?.positiveMessage ?? "", /HTML/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /JavaScript/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /heading|words|content/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /action|button click/i);
  assert.doesNotMatch(result.evaluation?.positiveMessage ?? "", /CSS/i);
  assert.notEqual(
    result.evaluation?.positiveMessage,
    "Nice start — one small fix: CSS changes how things look, while JavaScript makes button clicks change messages.",
  );
});

test("incomplete reflections are not treated as technology misconceptions", () => {
  const cases = [
    {
      projectSlug: "vibe-page",
      reflectionText: "I changed the color",
      aiRisk: "html_css_confusion",
      note: "It's important to clarify how CSS targets specific elements.",
      missingConcepts: ["CSS targeting/class detail"],
    },
    {
      projectSlug: "vibe-page",
      reflectionText: "I made it pink",
      aiRisk: "html_css_confusion",
      note: "The student needs to say what part changed color.",
      missingConcepts: ["what part changed color"],
    },
    {
      projectSlug: "vibe-page",
      reflectionText: "I styled the card",
      aiRisk: "html_css_confusion",
      note: "The student needs CSS targeting detail.",
      missingConcepts: ["visible result of the style change"],
    },
    {
      projectSlug: "all-about-me",
      reflectionText: "I changed the heading",
      aiRisk: "html_js_confusion",
      note: "The student needs the page result.",
      missingConcepts: ["visible page result"],
    },
    {
      projectSlug: "mood-switch",
      reflectionText: "The message changed",
      aiRisk: "event_result_confusion",
      note: "The student needs to say what triggered the message change.",
      missingConcepts: ["JavaScript action/event"],
    },
    {
      projectSlug: "build-your-own-mini-site",
      reflectionText: "I changed the title and colors",
      aiRisk: "html_js_confusion",
      note: "It seems like you might think JavaScript directly changed the title.",
      missingConcepts: ["JavaScript customization detail"],
    },
  ];

  for (const { projectSlug, reflectionText, aiRisk, note, missingConcepts } of cases) {
    const localEvaluation = getLocalEvaluation(projectSlug, reflectionText);
    const result = validateReflectionCoachAiEvaluation(
      getRawAiValue(localEvaluation, {
        analysis: validAnalysis({
          misconceptionRisk: aiRisk,
          misconceptionNote: note,
          missingConcepts,
        }),
        ...(localEvaluation.coachResult === "strong"
          ? {
              positiveMessage:
                "Nice start — one small fix: HTML, CSS, and JavaScript do different jobs.",
            }
          : {
              followUpQuestion:
                "Good start — one small fix: HTML, CSS, and JavaScript do different jobs. What part should you clarify?",
            }),
      }),
      localEvaluation,
      reflectionText,
    );

    assert.equal(result.fallbackReason, undefined, reflectionText);
    assert.equal(result.evaluation?.coachResult, localEvaluation.coachResult, reflectionText);
    assert.deepEqual(
      result.evaluation?.detectedSignals,
      localEvaluation.detectedSignals,
      reflectionText,
    );
    assert.equal(
      result.evaluation?.recommendedFocus,
      localEvaluation.recommendedFocus,
      reflectionText,
    );
    assert.equal(result.evaluation?.lessonFocus, localEvaluation.lessonFocus, reflectionText);
    assert.equal(result.evaluation?.analysis?.misconceptionRisk, "none", reflectionText);
    assert.equal(result.evaluation?.analysis?.misconceptionNote, undefined, reflectionText);
    assert.deepEqual(result.evaluation?.analysis?.missingConcepts, missingConcepts);

    if (localEvaluation.coachResult === "strong") {
      assert.equal(result.evaluation?.positiveMessage, localEvaluation.positiveMessage);
      assert.equal(result.evaluation?.followUpQuestion, undefined);
    } else {
      assert.equal(result.evaluation?.followUpQuestion, localEvaluation.followUpQuestion);
      assert.doesNotMatch(result.evaluation?.followUpQuestion ?? "", /one small fix/i);
    }
  }
});

test("missing capstone JavaScript detail is not treated as HTML and JavaScript confusion", () => {
  const reflectionText = "I changed the title and colors";
  const localEvaluation = getLocalEvaluation("build-your-own-mini-site", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        misconceptionRisk: "html_js_confusion",
        misconceptionNote:
          "It seems like you might think JavaScript directly changed the title.",
        inferredStudentUnderstanding: ["HTML title change", "CSS color change"],
        missingConcepts: ["JavaScript customization detail"],
      }),
      followUpQuestion:
        "Good start — one small fix: HTML changes page parts and words, while JavaScript usually runs after an action. What HTML/content part did you change?",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "almost_there");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "none");
  assert.equal(result.evaluation?.analysis?.misconceptionNote, undefined);
  assert.deepEqual(result.evaluation?.analysis?.missingConcepts, [
    "JavaScript customization detail",
  ]);
  assert.equal(
    result.evaluation?.followUpQuestion,
    "What did you customize with JavaScript/button or interactive?",
  );
  assert.doesNotMatch(result.evaluation?.followUpQuestion ?? "", /HTML\/content/i);
  assert.doesNotMatch(result.evaluation?.followUpQuestion ?? "", /one small fix/i);
});

test("strong AI response with extra follow-up keeps analysis and drops follow-up", () => {
  const reflectionText =
    "HTML changed the background, CSS changed the text, and JS changed the text too";
  const localEvaluation = getLocalEvaluation("build-your-own-mini-site", reflectionText);
  const result = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      analysis: validAnalysis({
        specificity: "somewhat_specific",
        personalization: "none",
        misconceptionRisk: "html_js_confusion",
        misconceptionNote:
          "It seems like you mentioned JavaScript changed the text directly, which is more about the action rather than the customization.",
        inferredStudentUnderstanding: [],
        missingConcepts: [],
        copiedExampleRisk: "none",
      }),
      followUpQuestion: "What did you customize with JavaScript?",
      positiveMessage:
        "Nice work — you covered what you customized in HTML, CSS, and JavaScript.",
    }),
    localEvaluation,
    reflectionText,
  );

  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.evaluation?.coachResult, "strong");
  assert.deepEqual(result.evaluation?.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(result.evaluation?.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(result.evaluation?.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(result.evaluation?.followUpQuestion, undefined);
  assert.equal(result.evaluation?.analysis?.misconceptionRisk, "html_css_confusion");
  assert.match(result.evaluation?.positiveMessage ?? "", /CSS/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /HTML/i);
  assert.match(result.evaluation?.positiveMessage ?? "", /background|style/i);
  assert.notEqual(
    result.evaluation?.positiveMessage,
    "Nice work — you covered what you customized in HTML, CSS, and JavaScript.",
  );
});

test("local fallback adds HTML and JavaScript misconception clarification without changing authority", () => {
  const reflectionText = "JavaScript changed the heading to say cats";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const fallbackEvaluation = getMisconceptionAwareLocalEvaluation(
    "all-about-me",
    reflectionText,
  );

  assert.equal(fallbackEvaluation.coachResult, "strong");
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, "html");
  assert.equal(fallbackEvaluation.analysis?.misconceptionRisk, "html_js_confusion");
  assert.match(fallbackEvaluation.positiveMessage ?? "", /HTML/i);
  assert.match(fallbackEvaluation.positiveMessage ?? "", /JavaScript/i);
  assert.match(fallbackEvaluation.positiveMessage ?? "", /heading|content/i);
  assert.doesNotMatch(fallbackEvaluation.positiveMessage ?? "", /CSS/i);
});

test("HTML tag wording result does not add a misconception overlay", () => {
  const reflectionText = "I changed the h1 text and my page started saying cats";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const fallbackEvaluation = getMisconceptionAwareLocalEvaluation(
    "all-about-me",
    reflectionText,
  );

  assert.equal(fallbackEvaluation.coachResult, "strong");
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, "html");
  assert.equal(fallbackEvaluation.followUpQuestion, undefined);
  assert.equal(fallbackEvaluation.analysis, undefined);
  assert.equal(fallbackEvaluation.teacherInsight, undefined);
  assert.equal(
    fallbackEvaluation.positiveMessage,
    "Nice work — you named an HTML change and what it did on the page.",
  );
});

test("CSS attributed to HTML content in HTML lesson keeps almost-there but adds misconception", () => {
  const reflectionText = "CSS changed the heading";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const fallbackEvaluation = getMisconceptionAwareLocalEvaluation(
    "all-about-me",
    reflectionText,
  );

  assert.equal(localEvaluation.coachResult, "almost_there");
  assert.equal(fallbackEvaluation.coachResult, "almost_there");
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, "html");
  assert.equal(fallbackEvaluation.analysis?.misconceptionRisk, "html_css_confusion");
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /HTML/i);
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /CSS/i);
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /page parts|words|content/i);
});

test("style changes in HTML lesson add HTML and CSS misconception without changing authority", () => {
  const misconceptionCases = [
    "I changed the color",
    "I made it pink",
    "I changed the title and colors",
  ];

  for (const reflectionText of misconceptionCases) {
    const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
    const fallbackEvaluation = getMisconceptionAwareLocalEvaluation(
      "all-about-me",
      reflectionText,
    );

    assert.equal(fallbackEvaluation.coachResult, localEvaluation.coachResult, reflectionText);
    assert.deepEqual(
      fallbackEvaluation.detectedSignals,
      localEvaluation.detectedSignals,
      reflectionText,
    );
    assert.equal(
      fallbackEvaluation.recommendedFocus,
      localEvaluation.recommendedFocus,
      reflectionText,
    );
    assert.equal(fallbackEvaluation.lessonFocus, "html", reflectionText);
    assert.equal(
      fallbackEvaluation.analysis?.misconceptionRisk,
      "html_css_confusion",
      reflectionText,
    );
    assert.match(fallbackEvaluation.followUpQuestion ?? "", /HTML/i, reflectionText);
    assert.match(fallbackEvaluation.followUpQuestion ?? "", /CSS/i, reflectionText);
  }
});

test("isolated style words in HTML lesson do not add misconception overlay", () => {
  const safeCases = ["color", "I like the color"];

  for (const reflectionText of safeCases) {
    const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
    const fallbackEvaluation = getMisconceptionAwareLocalEvaluation(
      "all-about-me",
      reflectionText,
    );

    assert.equal(fallbackEvaluation.coachResult, localEvaluation.coachResult, reflectionText);
    assert.deepEqual(
      fallbackEvaluation.detectedSignals,
      localEvaluation.detectedSignals,
      reflectionText,
    );
    assert.equal(
      fallbackEvaluation.recommendedFocus,
      localEvaluation.recommendedFocus,
      reflectionText,
    );
    assert.equal(fallbackEvaluation.lessonFocus, "html", reflectionText);
    assert.equal(fallbackEvaluation.analysis, undefined, reflectionText);
    assert.equal(fallbackEvaluation.teacherInsight, undefined, reflectionText);
  }
});

test("local fallback adds HTML and CSS misconception clarification without changing authority", () => {
  const reflectionText = "HTML changed the background color.";
  const localEvaluation = getLocalEvaluation("vibe-page", reflectionText);
  const fallbackEvaluation = getMisconceptionAwareLocalEvaluation("vibe-page", reflectionText);

  assert.equal(fallbackEvaluation.coachResult, localEvaluation.coachResult);
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(fallbackEvaluation.analysis?.misconceptionRisk, "html_css_confusion");
  assert.match(
    `${fallbackEvaluation.positiveMessage ?? ""} ${fallbackEvaluation.followUpQuestion ?? ""}`,
    /HTML/i,
  );
  assert.match(
    `${fallbackEvaluation.positiveMessage ?? ""} ${fallbackEvaluation.followUpQuestion ?? ""}`,
    /CSS/i,
  );
});

test("local fallback adds CSS and JavaScript misconception clarification without changing authority", () => {
  const reflectionText = "CSS made the button change the message.";
  const localEvaluation = getLocalEvaluation("mood-switch", reflectionText);
  const fallbackEvaluation = getMisconceptionAwareLocalEvaluation("mood-switch", reflectionText);

  assert.equal(fallbackEvaluation.coachResult, "weak");
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, "javascript");
  assert.equal(fallbackEvaluation.analysis?.misconceptionRisk, "css_js_confusion");
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /CSS/i);
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /JavaScript/i);
  assert.match(fallbackEvaluation.followUpQuestion ?? "", /button|click|message/i);
  assert.doesNotMatch(fallbackEvaluation.followUpQuestion ?? "", /HTML/i);
});

test("status mismatch fallback can still use misconception-aware local output", () => {
  const reflectionText = "JavaScript changed the heading to say cats";
  const localEvaluation = getLocalEvaluation("all-about-me", reflectionText);
  const aiMismatch = validateReflectionCoachAiEvaluation(
    getRawAiValue(localEvaluation, {
      coachResult: "weak",
    }),
    localEvaluation,
    reflectionText,
  );
  const fallbackEvaluation = applyLocalMisconceptionOverlay({
    evaluation: localEvaluation,
    reflectionText,
    projectSlug: "all-about-me",
  });

  assert.equal(aiMismatch.evaluation, null);
  assert.equal(aiMismatch.fallbackReason, "status_mismatch");
  assert.equal(aiMismatch.fallbackDebugDetail, "coachResult");
  assert.equal(fallbackEvaluation.coachResult, "strong");
  assert.deepEqual(fallbackEvaluation.detectedSignals, localEvaluation.detectedSignals);
  assert.equal(fallbackEvaluation.recommendedFocus, localEvaluation.recommendedFocus);
  assert.equal(fallbackEvaluation.lessonFocus, localEvaluation.lessonFocus);
  assert.equal(fallbackEvaluation.analysis?.misconceptionRisk, "html_js_confusion");
  assert.match(fallbackEvaluation.positiveMessage ?? "", /HTML/i);
  assert.match(fallbackEvaluation.positiveMessage ?? "", /JavaScript/i);
});

test("client API normalization tolerates omitted optional AI fields", () => {
  const localEvaluation = getLocalEvaluation("all-about-me", "I changed the heading.");
  const response = normalizeCoachApiResponse({
    ...localEvaluation,
    source: "ai",
  });

  assert.notEqual(response, null);
  assert.equal(response?.analysis, undefined);
  assert.equal(response?.teacherInsight, undefined);
  assert.equal(response?.detectedSignals.hasCopiedExample, false);
});
