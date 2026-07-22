import { TEACHER_REVIEW_FEEDBACK_HREF } from "@/lib/teacher/review-feedback";

export function TeacherReviewFeedbackPrompt() {
  return (
    <aside className="teacher-review-feedback" aria-labelledby="teacher-review-feedback-title">
      <div>
        <span className="teacher-review-feedback-kicker">Help improve teacher review</span>
        <h2 id="teacher-review-feedback-title">How did this review work for you?</h2>
        <p>
          Share what helped, what felt confusing, and what you would need to use DevBloom again.
        </p>
        <p className="teacher-review-feedback-privacy">
          Please don&apos;t include student names or student work.
        </p>
      </div>
      <a className="teacher-review-feedback-link" href={TEACHER_REVIEW_FEEDBACK_HREF}>
        Email teacher feedback
      </a>
    </aside>
  );
}
