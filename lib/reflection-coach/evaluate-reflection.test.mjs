import assert from "node:assert/strict";
import { test } from "node:test";

import reflectionEvaluator from "./evaluate-reflection.ts";

const { evaluateReflectionForCoach } = reflectionEvaluator;

const getCoachResult = (projectSlug, reflectionText) =>
  evaluateReflectionForCoach({
    projectSlug,
    reflectionText,
  }).coachResult;

const getEvaluation = (projectSlug, reflectionText) =>
  evaluateReflectionForCoach({
    projectSlug,
    reflectionText,
  });

test("all-about-me recognizes partial and complete reflections", () => {
  assert.equal(getCoachResult("all-about-me", "I changed the heading."), "almost_there");
  assert.equal(
    getCoachResult("all-about-me", "I changed the heading and it made my page show cats."),
    "strong",
  );
  assert.equal(getCoachResult("all-about-me", "I changed the big words to say soccer."), "strong");
  assert.equal(getCoachResult("all-about-me", "I made the page say my favorite animal."), "strong");
  assert.equal(getCoachResult("all-about-me", "the big words say soccer"), "almost_there");
  assert.equal(getCoachResult("all-about-me", "the page says soccer"), "almost_there");
  assert.equal(getCoachResult("all-about-me", "I made the page say soccer"), "strong");
  assert.equal(getCoachResult("all-about-me", "I added an image."), "almost_there");
  const h1TextReflection = getEvaluation(
    "all-about-me",
    "I changed the h1 text and my page started saying cats",
  );
  assert.equal(h1TextReflection.coachResult, "strong");
  assert.equal(h1TextReflection.followUpQuestion, undefined);
  assert.equal(
    h1TextReflection.positiveMessage,
    "Nice work — you named an HTML change and what it did on the page.",
  );
  assert.equal(getCoachResult("all-about-me", "I changed the h1 text"), "almost_there");
  assert.equal(getCoachResult("all-about-me", "my page started saying cats"), "almost_there");
  assert.equal(getCoachResult("all-about-me", "I did HTML."), "weak");
  assert.equal(getCoachResult("all-about-me", "soccer"), "weak");
});

test("vibe-page recognizes style, targeting, and design-result reflections", () => {
  assert.equal(getCoachResult("vibe-page", "I changed the color."), "almost_there");
  assert.equal(
    getCoachResult("vibe-page", "I changed the card color and it made my page look calmer."),
    "strong",
  );
  assert.equal(getCoachResult("vibe-page", "CSS used the .vibe-card class."), "almost_there");
  assert.equal(getCoachResult("vibe-page", "I made it pink and it looks cuter."), "strong");
  assert.equal(getCoachResult("vibe-page", "I changed the background color."), "strong");
  assert.equal(getCoachResult("vibe-page", "I styled the card."), "almost_there");
  assert.equal(getCoachResult("vibe-page", "It looks good."), "weak");
  assert.notEqual(getCoachResult("vibe-page", "I made the words big"), "weak");
  assert.notEqual(getCoachResult("vibe-page", "I changed the font size"), "weak");
  assert.notEqual(getCoachResult("vibe-page", "I made the card round"), "weak");
  assert.equal(getCoachResult("vibe-page", "the words are big"), "almost_there");
});

test("mood-switch recognizes event and page-result reflections", () => {
  assert.equal(getCoachResult("mood-switch", "When I clicked the button."), "almost_there");
  assert.equal(getCoachResult("mood-switch", "The message changed."), "almost_there");
  assert.equal(
    getCoachResult("mood-switch", "When I clicked the button, the message changed."),
    "strong",
  );
  assert.equal(getCoachResult("mood-switch", "I pressed the button and the words changed."), "strong");
  assert.equal(getCoachResult("mood-switch", "The button made a new mood show up."), "strong");
  assert.equal(getCoachResult("mood-switch", "I pressed it."), "almost_there");
  assert.equal(getCoachResult("mood-switch", "I did JavaScript."), "weak");
});

test("build-your-own-mini-site requires recognizable customization details", () => {
  assert.equal(getCoachResult("build-your-own-mini-site", "I changed the title."), "almost_there");
  assert.equal(
    getCoachResult("build-your-own-mini-site", "I changed the title and colors."),
    "almost_there",
  );
  assert.equal(
    getCoachResult("build-your-own-mini-site", "I changed the button message."),
    "almost_there",
  );
  assert.equal(
    getCoachResult("build-your-own-mini-site", "I changed the title, colors, and button message."),
    "strong",
  );
  assert.equal(
    getCoachResult(
      "build-your-own-mini-site",
      "I changed the words, made it purple, and the button shows a new message.",
    ),
    "strong",
  );
  assert.equal(
    getCoachResult(
      "build-your-own-mini-site",
      "I added an image, changed the background, and made the button change the text.",
    ),
    "strong",
  );
  const personalizedMiniSiteReflection = getEvaluation(
    "build-your-own-mini-site",
    "I changed the title to Soccer Facts, the colors to green, and the button message to Go team.",
  );
  assert.equal(personalizedMiniSiteReflection.coachResult, "strong");
  assert.equal(personalizedMiniSiteReflection.followUpQuestion, undefined);
  assert.equal(
    getCoachResult("build-your-own-mini-site", "I added an image and changed the background."),
    "almost_there",
  );

  assert.equal(getCoachResult("build-your-own-mini-site", "I changed stuff."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I customized my project."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I made it better."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I did things."), "weak");
});

test("isolated or praise-only vocabulary stays weak", () => {
  assert.equal(getCoachResult("all-about-me", "heading"), "weak");
  assert.equal(getCoachResult("all-about-me", "The heading is nice."), "weak");
  assert.equal(getCoachResult("vibe-page", "color"), "weak");
  assert.equal(getCoachResult("vibe-page", "big"), "weak");
  assert.equal(getCoachResult("vibe-page", "round"), "weak");
  assert.equal(getCoachResult("vibe-page", "I like the color."), "weak");
  assert.equal(getCoachResult("vibe-page", "I like big words."), "weak");
  assert.equal(getCoachResult("vibe-page", "The button is cool."), "weak");
  assert.equal(getCoachResult("vibe-page", "I did CSS."), "weak");
  assert.equal(getCoachResult("mood-switch", "button"), "weak");
  assert.equal(getCoachResult("mood-switch", "I used JavaScript."), "weak");
});

test("follow-up questions ask for the missing concept", () => {
  assert.match(
    getEvaluation("all-about-me", "I changed the heading.").followUpQuestion ?? "",
    /show|page/i,
  );
  assert.match(
    getEvaluation("all-about-me", "Now my page shows cats.").followUpQuestion ?? "",
    /HTML|part|heading|paragraph|list/i,
  );
  assert.match(
    getEvaluation("vibe-page", "I changed the color.").followUpQuestion ?? "",
    /part|page|design/i,
  );
  assert.match(
    getEvaluation("vibe-page", "CSS used the .vibe-card class.").followUpQuestion ?? "",
    /style|color|spacing|card/i,
  );
  assert.match(
    getEvaluation("mood-switch", "When I clicked the button.").followUpQuestion ?? "",
    /changed|after/i,
  );
  assert.match(
    getEvaluation("mood-switch", "The message changed.").followUpQuestion ?? "",
    /action|run|clicked|pressed/i,
  );
  assert.match(
    getEvaluation("build-your-own-mini-site", "I changed the title and colors.").followUpQuestion ?? "",
    /JavaScript|button|interactive/i,
  );
});

test("copied project examples ask students to personalize", () => {
  const allAboutMe = getEvaluation(
    "all-about-me",
    "I changed the heading, and it made my page show my topic.",
  );
  assert.notEqual(allAboutMe.coachResult, "strong");
  assert.equal(allAboutMe.coachResult, "weak");
  assert.equal(allAboutMe.detectedSignals.hasCopiedExample, true);
  assert.equal(allAboutMe.recommendedFocus, "make_it_yours");
  assert.match(allAboutMe.followUpQuestion ?? "", /example|own page/i);

  const allAboutMeNoComma = getEvaluation(
    "all-about-me",
    "I changed the heading and it made my page show my topic.",
  );
  assert.notEqual(allAboutMeNoComma.coachResult, "strong");
  assert.equal(allAboutMeNoComma.detectedSignals.hasCopiedExample, true);
  assert.equal(allAboutMeNoComma.recommendedFocus, "make_it_yours");

  const allAboutMeSplitSentence = getEvaluation(
    "all-about-me",
    "I changed the heading. It made my page show my topic.",
  );
  assert.notEqual(allAboutMeSplitSentence.coachResult, "strong");
  assert.equal(allAboutMeSplitSentence.detectedSignals.hasCopiedExample, true);
  assert.equal(allAboutMeSplitSentence.recommendedFocus, "make_it_yours");

  const allAboutMeWithExamplePrefix = getEvaluation(
    "all-about-me",
    "Example: I changed the heading, and it made my page show my topic.",
  );
  assert.notEqual(allAboutMeWithExamplePrefix.coachResult, "strong");
  assert.equal(allAboutMeWithExamplePrefix.detectedSignals.hasCopiedExample, true);
  assert.equal(allAboutMeWithExamplePrefix.recommendedFocus, "make_it_yours");

  const vaguePromptCopies = [
    [
      "all-about-me",
      "One thing I changed in the HTML was the heading. It changed my page by showing my topic.",
    ],
    [
      "vibe-page",
      "One style I changed with CSS was the card color. CSS knew what to style because the class.",
    ],
    [
      "mood-switch",
      "JavaScript changed my page when I clicked the button. The part that changed was the message.",
    ],
    [
      "build-your-own-mini-site",
      "In HTML, I customized the title. In CSS, I customized the colors. In JavaScript, I customized the button message.",
    ],
  ];

  for (const [projectSlug, reflectionText] of vaguePromptCopies) {
    const evaluation = getEvaluation(projectSlug, reflectionText);
    assert.notEqual(evaluation.coachResult, "strong", reflectionText);
    assert.equal(evaluation.detectedSignals.hasCopiedExample, true, reflectionText);
    assert.equal(evaluation.recommendedFocus, "make_it_yours", reflectionText);
    assert.match(evaluation.followUpQuestion ?? "", /example|own|project|page|style|message/i);
  }

  const vibePage = getEvaluation(
    "vibe-page",
    "I changed the card color. CSS knew what to style because of the .vibe-card class.",
  );
  assert.notEqual(vibePage.coachResult, "strong");
  assert.equal(vibePage.coachResult, "weak");
  assert.equal(vibePage.detectedSignals.hasCopiedExample, true);
  assert.equal(vibePage.recommendedFocus, "make_it_yours");
  assert.match(vibePage.followUpQuestion ?? "", /example|own style|style change/i);

  const moodSwitch = getEvaluation(
    "mood-switch",
    "JavaScript changed my page when I clicked the button. The message changed.",
  );
  assert.notEqual(moodSwitch.coachResult, "strong");
  assert.equal(moodSwitch.coachResult, "weak");
  assert.equal(moodSwitch.detectedSignals.hasCopiedExample, true);
  assert.equal(moodSwitch.recommendedFocus, "make_it_yours");
  assert.match(moodSwitch.followUpQuestion ?? "", /example|message|mood/i);

  const miniSite = getEvaluation(
    "build-your-own-mini-site",
    "In HTML, I changed the title. In CSS, I changed the colors. In JavaScript, I changed the button message.",
  );
  assert.notEqual(miniSite.coachResult, "strong");
  assert.equal(miniSite.coachResult, "weak");
  assert.equal(miniSite.detectedSignals.hasCopiedExample, true);
  assert.equal(miniSite.recommendedFocus, "make_it_yours");
  assert.match(miniSite.followUpQuestion ?? "", /example|own title|color|button message/i);
});

test("personalized versions of examples still evaluate normally", () => {
  const cases = [
    ["all-about-me", "I changed the heading and it made my page show cats."],
    ["all-about-me", "I changed the heading to Soccer Facts and my page shows soccer."],
    ["all-about-me", "I changed the h1 text and my page started saying cats."],
    ["vibe-page", "I changed the card color to purple and CSS used .vibe-card."],
    ["mood-switch", "When I clicked the button, the message changed to excited."],
    [
      "build-your-own-mini-site",
      "In HTML, I changed the title to Soccer Facts. In CSS, I changed the colors to green. In JavaScript, I changed the button message to Go team.",
    ],
  ];

  for (const [projectSlug, reflectionText] of cases) {
    const evaluation = getEvaluation(projectSlug, reflectionText);
    assert.equal(evaluation.coachResult, "strong");
    assert.equal(evaluation.detectedSignals.hasCopiedExample, false);
  }
});

test("personalized prompt-shaped reflections are not marked as copied examples", () => {
  const cases = [
    [
      "all-about-me",
      "One thing I changed in the HTML was the heading. It changed my page by showing cats.",
    ],
    [
      "vibe-page",
      "One style I changed with CSS was purple. CSS knew what to style because of the .vibe-card class.",
    ],
    [
      "mood-switch",
      "JavaScript changed my page when I clicked the button. The part that changed was the message to excited.",
    ],
    [
      "build-your-own-mini-site",
      "In HTML, I customized the title to Soccer Facts. In CSS, I customized the colors to green. In JavaScript, I customized the button message to Go team.",
    ],
  ];

  for (const [projectSlug, reflectionText] of cases) {
    const evaluation = getEvaluation(projectSlug, reflectionText);
    assert.equal(evaluation.detectedSignals.hasCopiedExample, false, reflectionText);
    assert.notEqual(evaluation.recommendedFocus, "make_it_yours", reflectionText);
  }
});

test("short example fragments are not marked as copied examples", () => {
  const cases = [
    ["all-about-me", "I changed the heading.", "almost_there"],
    ["vibe-page", "I changed the card color.", "almost_there"],
    ["vibe-page", "CSS used the .vibe-card class.", "almost_there"],
    ["mood-switch", "The message changed.", "almost_there"],
    ["build-your-own-mini-site", "I changed the button message.", "almost_there"],
    ["mood-switch", "When I clicked the button, the message changed.", "strong"],
  ];

  for (const [projectSlug, reflectionText, expectedResult] of cases) {
    const evaluation = getEvaluation(projectSlug, reflectionText);
    assert.equal(evaluation.coachResult, expectedResult);
    assert.equal(evaluation.detectedSignals.hasCopiedExample, false);
  }
});

test("unknown project slugs use the generic fallback evaluator", () => {
  assert.equal(
    getCoachResult("future-project", "I changed the button and the page showed a new message."),
    "strong",
  );
});
