import { AppShell } from "@/components/app-shell";
import { leaveStudentSession } from "@/app/student/actions";
import { StudentProjectLaunchCard } from "@/components/student/student-project-launch-card";
import { getAllProjects } from "@/lib/projects";
import { requireStudentSession } from "@/lib/student/require-student-session";

const recommendedProjectSlug = "all-about-me";

export default async function StudentProjectsPage() {
  const session = await requireStudentSession();
  const projects = [...getAllProjects()].sort(
    (left, right) =>
      Number(right.slug === recommendedProjectSlug) - Number(left.slug === recommendedProjectSlug),
  );

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
              Start with the recommended 20-25 minute lesson, or choose any project. Your work will
              resume here the next time you return.
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
              <StudentProjectLaunchCard
                key={project.slug}
                project={project}
                isRecommended={project.slug === recommendedProjectSlug}
              />
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
