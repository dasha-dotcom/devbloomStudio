import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { projectCards } from "@/lib/projects";

export default function ProjectsPage() {
  return (
    <AppShell>
      <section className="page-hero">
        <span className="eyebrow">Project library</span>
        <h1>Choose your next build.</h1>
        <p>
          Start with a polished beginner project, then keep leveling up with new
          lessons that build from structure into styling and beyond.
        </p>
      </section>

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="project-grid">
          {projectCards.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
