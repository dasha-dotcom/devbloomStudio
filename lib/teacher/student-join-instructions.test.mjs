import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudentJoinInstructions,
  getStudentJoinUrl,
} from "./student-join-instructions.ts";

test("builds a complete student handoff with the class-specific join URL", () => {
  assert.equal(
    buildStudentJoinInstructions({
      origin: "https://devbloom-studio.vercel.app",
      classCode: "BLOOM7",
      studentName: "Maya",
      pin: "246810",
    }),
    [
      "Join your DevBloom Studio class",
      "Open: https://devbloom-studio.vercel.app/join/BLOOM7",
      "Class code: BLOOM7",
      "Student name: Maya",
      "PIN: 246810",
      "",
      "Keep this PIN private. It will not be shown to your teacher again.",
    ].join("\n"),
  );
});

test("encodes a class code before placing it in the join URL", () => {
  assert.equal(
    getStudentJoinUrl("https://example.com/teacher/classes/123", "BLOOM 7"),
    "https://example.com/join/BLOOM%207",
  );
});
