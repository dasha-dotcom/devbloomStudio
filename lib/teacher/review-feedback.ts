export const TEACHER_REVIEW_FEEDBACK_EMAIL = "devbloom-studio@mail.tin.computer";
export const TEACHER_REVIEW_FEEDBACK_SUBJECT = "DevBloom teacher feedback";
export const TEACHER_REVIEW_FEEDBACK_BODY = [
  "Hi DevBloom team,",
  "",
  "I just reviewed a saved student attempt.",
  "",
  "1. What helped you understand the student's progress?",
  "2. What felt confusing or got in the way?",
  "3. What would you need to use DevBloom again?",
  "",
  "Please don't include student names or student work.",
].join("\n");

export const TEACHER_REVIEW_FEEDBACK_HREF =
  `mailto:${TEACHER_REVIEW_FEEDBACK_EMAIL}?` +
  new URLSearchParams({
    subject: TEACHER_REVIEW_FEEDBACK_SUBJECT,
    body: TEACHER_REVIEW_FEEDBACK_BODY,
  }).toString();
