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

test("unknown project slugs use the generic fallback evaluator", () => {
  assert.equal(
    getCoachResult("future-project", "I changed the button and the page showed a new message."),
    "strong",
  );
});
