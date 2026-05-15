import { AppShell } from "@/components/app-shell";
import { leaveStudentSession } from "@/app/student/actions";
import { StudentProjectLaunchCard } from "@/components/student/student-project-launch-card";
import { getAllProjects } from "@/lib/projects";
import { requireStudentSession } from "@/lib/student/require-student-session";

export default async function StudentProjectsPage() {
  const session = await requireStudentSession();
  const projects = getAllProjects();

  return (
    <AppShell navMode="student">
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Student projects</span>
            <h1 className="section-title">Welcome, {session.studentDisplayName}</h1>
          </div>
          <p className="section-copy">{session.className}</p>
        </div>

        <div className="glass-card teacher-panel student-session-panel">
          <div>
            <strong>Your class session</strong>
            <p className="muted teacher-panel-copy">
              Choose any project to start building. Your project attempt will resume here the next time you return.
            </p>
          </div>

          <form action={leaveStudentSession}>
            <button type="submit" className="button-ghost">
              Leave class session
            </button>
          </form>
        </div>

        <section className="section" style={{ paddingTop: 28 }}>
          <div className="project-grid">
            {projects.map((project) => (
              <StudentProjectLaunchCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
