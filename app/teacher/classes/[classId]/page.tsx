import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { CreateStudentForm } from "@/components/teacher/create-student-form";
import { getDb } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { getClassAttemptSummaries } from "@/lib/teacher/get-class-attempt-summaries";
import { requireTeacherClass } from "@/lib/teacher/require-teacher-class";

type TeacherClassDetailPageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function TeacherClassDetailPage({ params }: TeacherClassDetailPageProps) {
  const { classId } = await params;
  const { teacherClass } = await requireTeacherClass(classId);
  const db = getDb();

  const roster = await db.query.studentProfiles.findMany({
    where: eq(studentProfiles.classId, teacherClass.id),
    orderBy: [asc(studentProfiles.displayName), asc(studentProfiles.createdAt)],
  });
  const attemptSummaries = await getClassAttemptSummaries(teacherClass.id);

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Class detail</span>
          <h1 className="section-title">{teacherClass.name}</h1>
        </div>
        <p className="section-copy">
          Join code: <strong>{teacherClass.joinCode}</strong>
        </p>
      </div>

      <div className="teacher-grid">
        <div className="glass-card teacher-panel">
          <strong>Roster</strong>
          <p className="muted teacher-panel-copy">
            {roster.length === 0 ? "No students yet." : `${roster.length} student${roster.length === 1 ? "" : "s"}`}
          </p>

          <div className="teacher-list">
            {roster.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Add your first student to create a class roster.
              </p>
            ) : (
              roster.map((student) => {
                const attemptSummary = attemptSummaries.get(student.id);
                const latestAttemptLabel = !attemptSummary
                  ? "No project attempts yet."
                  : attemptSummary.latestProjectStatus === "completed"
                    ? `Latest: ${attemptSummary.latestProjectTitle} completed`
                    : `Latest: ${attemptSummary.latestProjectTitle} ${attemptSummary.latestProgressPercent ?? 0}%`;

                const progressSummary = !attemptSummary
                  ? null
                  : `${attemptSummary.completedCount} completed • active ${attemptSummary.latestActiveAt?.toLocaleString() ?? "recently"}`;

                return (
                  <Link
                    key={student.id}
                    href={`/teacher/classes/${teacherClass.id}/students/${student.id}`}
                    className="teacher-list-item"
                  >
                    <div>
                      <strong>{student.displayName}</strong>
                      <p className="muted teacher-list-copy">
                        {student.isActive ? "Active" : "Inactive"}
                      </p>
                      <p className="muted teacher-list-copy teacher-attempt-summary">{latestAttemptLabel}</p>
                      {progressSummary ? (
                        <p className="muted teacher-list-copy teacher-attempt-summary">{progressSummary}</p>
                      ) : null}
                    </div>
                    <span className="pill">Open</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <CreateStudentForm classId={teacherClass.id} />
      </div>
    </section>
  );
}
