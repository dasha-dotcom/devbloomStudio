import Link from "next/link";

import { getStudentAttempts } from "@/lib/teacher/get-student-attempts";
import { requireTeacherStudent } from "@/lib/teacher/require-teacher-student";

type TeacherStudentDetailPageProps = {
  params: Promise<{
    classId: string;
    studentId: string;
  }>;
};

export default async function TeacherStudentDetailPage({ params }: TeacherStudentDetailPageProps) {
  const { classId, studentId } = await params;
  const { teacherStudent } = await requireTeacherStudent(classId, studentId);
  const attempts = await getStudentAttempts(classId, studentId);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Student detail</span>
          <h1 className="section-title">{teacherStudent.displayName}</h1>
        </div>
        <p className="section-copy">{teacherStudent.className}</p>
      </div>

      <div className="glass-card teacher-panel">
        <strong>Profile</strong>
        <div className="teacher-meta-grid">
          <div className="teacher-meta-card">
            <span className="muted">Status</span>
            <strong>{teacherStudent.isActive ? "Active" : "Inactive"}</strong>
          </div>
          <div className="teacher-meta-card">
            <span className="muted">Created</span>
            <strong>{teacherStudent.createdAt.toLocaleDateString()}</strong>
          </div>
          <div className="teacher-meta-card">
            <span className="muted">Join code</span>
            <strong>{teacherStudent.joinCode}</strong>
          </div>
        </div>
      </div>

      <div className="glass-card teacher-panel" style={{ marginTop: 24 }}>
        <strong>Project attempts</strong>
        <p className="muted teacher-panel-copy">
          {attempts.length === 0
            ? "This student has not started a backend-saved project yet."
            : `${attempts.length} attempt${attempts.length === 1 ? "" : "s"} sorted by latest activity.`}
        </p>

        <div className="teacher-list">
          {attempts.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No saved attempts yet.
            </p>
          ) : (
            attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/teacher/classes/${classId}/students/${studentId}/attempts/${attempt.id}`}
                className="teacher-list-item"
              >
                <div>
                  <strong>{attempt.projectTitle}</strong>
                  <p className="muted teacher-list-copy">
                    {attempt.status === "completed" ? "Completed" : `${attempt.progressPercent ?? 0}%`} •{" "}
                    {attempt.currentStepTitle}
                  </p>
                  <p className="muted teacher-list-copy teacher-attempt-summary">
                    Active {attempt.lastActiveAt.toLocaleString()}
                    {attempt.finishedAt ? ` • Finished ${attempt.finishedAt.toLocaleDateString()}` : ""}
                  </p>
                  {attempt.latestReflectionExcerpt ? (
                    <p className="muted teacher-list-copy teacher-attempt-summary">
                      Reflection: {attempt.latestReflectionExcerpt}
                    </p>
                  ) : null}
                </div>
                <span className="pill">Open</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
