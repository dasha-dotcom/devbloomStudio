import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateReflectionForCoach } from "./evaluate-reflection.ts";

const getCoachResult = (projectSlug, reflectionText) =>
  evaluateReflectionForCoach({
    projectSlug,
    reflectionText,
  }).coachResult;

test("all-about-me recognizes partial and complete reflections", () => {
  assert.equal(getCoachResult("all-about-me", "I changed the heading."), "almost_there");
  assert.equal(
    getCoachResult("all-about-me", "I changed the heading and it made my page show cats."),
    "strong",
  );
});

test("vibe-page recognizes style, targeting, and design-result reflections", () => {
  assert.equal(getCoachResult("vibe-page", "I changed the color."), "almost_there");
  assert.equal(
    getCoachResult("vibe-page", "I changed the card color and it made my page look calmer."),
    "strong",
  );
  assert.equal(getCoachResult("vibe-page", "CSS used the .vibe-card class."), "almost_there");
});

test("mood-switch recognizes event and page-result reflections", () => {
  assert.equal(getCoachResult("mood-switch", "When I clicked the button."), "almost_there");
  assert.equal(getCoachResult("mood-switch", "The message changed."), "almost_there");
  assert.equal(
    getCoachResult("mood-switch", "When I clicked the button, the message changed."),
    "strong",
  );
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

  assert.equal(getCoachResult("build-your-own-mini-site", "I changed stuff."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I customized my project."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I made it better."), "weak");
  assert.equal(getCoachResult("build-your-own-mini-site", "I did things."), "weak");
});
