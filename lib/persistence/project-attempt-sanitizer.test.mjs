import assert from "node:assert/strict";
import { test } from "node:test";

import allAboutMeProjectModule from "../projects/all-about-me.ts";
import projectAttemptSanitizer from "./project-attempt-sanitizer.ts";
import teacherInsights from "../reflection-coach/teacher-insights.ts";

const { allAboutMeProject } = allAboutMeProjectModule;
const { createFreshProjectAttempt, normalizeProjectAttempt } = projectAttemptSanitizer;
const { deriveReflectionCoachTeacherInsight } = teacherInsights;

const baseAttemptWithChecks = (reflectionCoachChecks) => ({
  ...createFreshProjectAttempt(allAboutMeProject, "ai_coach"),
  reflectionCoachChecks,
});

const validAnalysis = (overrides = {}) => ({
  specificity: "somewhat_specific",
  personalization: "some_personal_detail",
  misconceptionRisk: "none",
  inferredStudentUnderstanding: [],
  missingConcepts: [],
  copiedExampleRisk: "none",
  ...overrides,
});

const copiedExampleDetectedSignals = {
  hasSpecificEdit: true,
  hasPageDetail: true,
  hasActionOrChange: true,
  hasConceptConnection: true,
  hasReasonOrChoice: false,
  hasCopiedExample: true,
};

const requiredCheckFields = {
  checkedAt: "2026-06-12T12:00:00.000Z",
  reflectionText: "I changed the heading.",
  coachResult: "almost_there",
  lessonFocus: "html",
  source: "ai",
};

test("old reflection coach checks without analysis still sanitize", () => {
  const normalized = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([requiredCheckFields]),
  );

  assert.notEqual(normalized, null);
  assert.equal(normalized?.reflectionCoachChecks.length, 1);
  assert.equal(normalized?.reflectionCoachChecks[0].analysis, undefined);
  assert.equal(normalized?.reflectionCoachChecks[0].teacherInsight, undefined);
});

test("valid reflection coach analysis and teacher insight are preserved", () => {
  const normalized = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([
      {
        ...requiredCheckFields,
        analysis: validAnalysis({
          misconceptionRisk: "html_css_confusion",
          misconceptionNote: "Student may be confusing HTML and CSS.",
          missingConcepts: ["CSS style detail"],
          copiedExampleRisk: "possible",
        }),
        teacherInsight: "Student may be confusing HTML content with CSS styling.",
      },
    ]),
  );
  const check = normalized?.reflectionCoachChecks[0];

  assert.notEqual(check, undefined);
  assert.equal(check?.analysis?.misconceptionRisk, "html_css_confusion");
  assert.equal(check?.analysis?.misconceptionNote, "Student may be confusing HTML and CSS.");
  assert.deepEqual(check?.analysis?.missingConcepts, ["CSS style detail"]);
  assert.equal(check?.analysis?.copiedExampleRisk, "possible");
  assert.equal(
    check?.teacherInsight,
    "Student may be confusing HTML content with CSS styling.",
  );
});

test("saved copied-example checks preserve detected signal and teacher insight", () => {
  const normalized = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([
      {
        ...requiredCheckFields,
        reflectionText: "I changed the heading, and it made my page show my topic.",
        coachResult: "weak",
        detectedSignals: copiedExampleDetectedSignals,
        recommendedFocus: "make_it_yours",
      },
    ]),
  );
  const check = normalized?.reflectionCoachChecks[0];

  assert.notEqual(check, undefined);
  assert.equal(check?.detectedSignals?.hasCopiedExample, true);
  assert.equal(check?.recommendedFocus, "make_it_yours");
  assert.equal(
    check?.teacherInsight,
    "Reflection appears close to the example and may need more personalization.",
  );
});

test("invalid analysis enums are dropped and copied example risk defaults safely", () => {
  const invalidAnalysisAttempt = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([
      {
        ...requiredCheckFields,
        analysis: validAnalysis({ misconceptionRisk: "maybe_confused" }),
      },
    ]),
  );
  const copiedRiskAttempt = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([
      {
        ...requiredCheckFields,
        analysis: validAnalysis({ copiedExampleRisk: "maybe" }),
      },
    ]),
  );

  assert.equal(invalidAnalysisAttempt?.reflectionCoachChecks[0].analysis, undefined);
  assert.equal(
    copiedRiskAttempt?.reflectionCoachChecks[0].analysis?.copiedExampleRisk,
    "none",
  );
});

test("overlong teacher insight is rejected during sanitizing", () => {
  const normalized = normalizeProjectAttempt(
    allAboutMeProject,
    baseAttemptWithChecks([
      {
        ...requiredCheckFields,
        teacherInsight: "A".repeat(260),
      },
    ]),
  );

  assert.equal(normalized?.reflectionCoachChecks[0].teacherInsight, undefined);
});

test("teacher insight helper derives useful nonjudgmental summaries", () => {
  assert.equal(
    deriveReflectionCoachTeacherInsight({
      coachResult: "weak",
      analysis: validAnalysis({ misconceptionRisk: "html_css_confusion" }),
    }),
    "Student may be confusing HTML content with CSS styling.",
  );
  assert.equal(
    deriveReflectionCoachTeacherInsight({
      coachResult: "weak",
      detectedSignals: {
        hasSpecificEdit: true,
        hasPageDetail: true,
        hasActionOrChange: false,
        hasConceptConnection: false,
        hasReasonOrChoice: false,
        hasCopiedExample: true,
      },
      recommendedFocus: "make_it_yours",
    }),
    "Reflection appears close to the example and may need more personalization.",
  );
  assert.equal(
    deriveReflectionCoachTeacherInsight({
      coachResult: "almost_there",
      analysis: validAnalysis({ missingConcepts: ["JavaScript button detail"] }),
    }),
    "Student may need support adding: JavaScript button detail.",
  );
  assert.equal(
    deriveReflectionCoachTeacherInsight({
      coachResult: "almost_there",
    }),
    undefined,
  );
  assert.equal(
    deriveReflectionCoachTeacherInsight({
      coachResult: "strong",
      analysis: validAnalysis({ specificity: "specific", personalization: "clearly_personalized" }),
    }),
    undefined,
  );
});
