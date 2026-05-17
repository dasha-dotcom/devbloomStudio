import Link from "next/link";

import { signOutTeacher } from "@/app/auth/actions";
import { CreateClassForm } from "@/components/teacher/create-class-form";
import { getCurrentTeacher } from "@/lib/auth/get-current-teacher";
import { getTeacherClasses } from "@/lib/teacher/get-teacher-classes";

export default async function TeacherDashboardPage() {
  const teacher = await getCurrentTeacher();
  const teacherClasses = await getTeacherClasses();

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Teacher dashboard</span>
          <h1 className="section-title">Welcome back</h1>
        </div>
        <p className="section-copy">
          Create classes, manage your roster, and open read-only student project progress by class.
        </p>
      </div>

      <div className="teacher-grid">
        <div className="glass-card teacher-panel">
          <strong>Your classes</strong>
          <p className="muted teacher-panel-copy">
            Signed in as {teacher.email}. Open a class to view the roster and student details.
          </p>

          <div className="teacher-list">
            {teacherClasses.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No classes yet. Create your first class to get started.
              </p>
            ) : (
              teacherClasses.map((teacherClass) => (
                <Link
                  key={teacherClass.id}
                  href={`/teacher/classes/${teacherClass.id}`}
                  className="teacher-list-item"
                >
                  <div>
                    <strong>{teacherClass.name}</strong>
                    <p className="muted teacher-list-copy">
                      Join code {teacherClass.joinCode} • {teacherClass.rosterCount} student
                      {teacherClass.rosterCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="pill">Open</span>
                </Link>
              ))
            )}
          </div>
        </div>

        <CreateClassForm />
      </div>

      <div className="glass-card teacher-panel" style={{ marginTop: 24 }}>
        <strong>Class area</strong>
        <p className="muted teacher-panel-copy">
          Student join and saved project attempts are live. Open a class to review the roster, student attempt
          summaries, and read-only project details.
        </p>

        <form action={signOutTeacher}>
          <button type="submit" className="button-ghost">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
