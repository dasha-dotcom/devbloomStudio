import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFinishedProjectInvitation,
  canCreateFinishedProjectInvitation,
  FINISHED_PROJECT_INVITE_SOURCE,
  isFinishedProjectInvitation,
} from "./finished-project-invitation.ts";

test("requires an adult confirmation before an invitation can be created", () => {
  assert.equal(canCreateFinishedProjectInvitation(false), false);
  assert.equal(canCreateFinishedProjectInvitation(true), true);
});

test("builds an invitation from public project metadata only", () => {
  const invitation = buildFinishedProjectInvitation({
    origin: "https://devbloom-studio.vercel.app/private/path?student=hidden",
    projectSlug: "all-about-me",
    projectTitle: "All About Me",
  });

  assert.equal(
    invitation.url,
    `https://devbloom-studio.vercel.app/projects/all-about-me?invite=${FINISHED_PROJECT_INVITE_SOURCE}`,
  );
  assert.equal(
    invitation.message,
    `I finished All About Me in DevBloom Studio. A parent or teacher invited you to try the same free coding project: ${invitation.url}`,
  );

  for (const privateValue of [
    "student=hidden",
    "private/path",
    "reflection",
    "classCode",
    "pin",
    "attemptId",
    "latestCode",
  ]) {
    assert.equal(invitation.message.includes(privateValue), false);
  }
});

test("recognizes only the finished-project invitation source", () => {
  assert.equal(isFinishedProjectInvitation(`?invite=${FINISHED_PROJECT_INVITE_SOURCE}`), true);
  assert.equal(isFinishedProjectInvitation("?invite=social-post"), false);
  assert.equal(isFinishedProjectInvitation("?student=hidden"), false);
});
