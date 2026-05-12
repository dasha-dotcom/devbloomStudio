import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { leaveStudentSession } from "@/app/student/actions";
import { getAllProjects, getProjectHref } from "@/lib/projects";
import { requireStudentSession } from "@/lib/student/require-student-session";

export default async function StudentProjectsPage() {
  const session = await requireStudentSession();
  const projectCards = getAllProjects().map((project) => ({
    ...project.projectCard,
    href: getProjectHref(project.slug),
  }));

  return (
    <AppShell>
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
              Choose any project to start building. Project progress still saves locally on this device for now.
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
            {projectCards.map((project) => (
              <ProjectCard key={project.href} project={project} />
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
