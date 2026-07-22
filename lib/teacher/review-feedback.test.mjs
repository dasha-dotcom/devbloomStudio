import assert from "node:assert/strict";
import { test } from "node:test";

import reviewFeedbackModule from "./review-feedback.ts";

const {
  TEACHER_REVIEW_FEEDBACK_BODY,
  TEACHER_REVIEW_FEEDBACK_EMAIL,
  TEACHER_REVIEW_FEEDBACK_HREF,
  TEACHER_REVIEW_FEEDBACK_SUBJECT,
} = reviewFeedbackModule;

test("teacher review feedback email stays generic and privacy-safe", () => {
  const mailto = new URL(TEACHER_REVIEW_FEEDBACK_HREF);

  assert.equal(mailto.protocol, "mailto:");
  assert.equal(mailto.pathname, TEACHER_REVIEW_FEEDBACK_EMAIL);
  assert.equal(mailto.searchParams.get("subject"), TEACHER_REVIEW_FEEDBACK_SUBJECT);
  assert.equal(mailto.searchParams.get("body"), TEACHER_REVIEW_FEEDBACK_BODY);
  assert.match(TEACHER_REVIEW_FEEDBACK_BODY, /what helped/i);
  assert.match(TEACHER_REVIEW_FEEDBACK_BODY, /what felt confusing/i);
  assert.match(TEACHER_REVIEW_FEEDBACK_BODY, /what would you need to use DevBloom again/i);
  assert.match(TEACHER_REVIEW_FEEDBACK_BODY, /don't include student names or student work/i);
});
