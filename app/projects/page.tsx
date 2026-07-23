import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/project-card";
import { getAllProjectCards } from "@/lib/projects";

export default function ProjectsPage() {
  const projectCards = getAllProjectCards();

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

      <section className="section" style={{ paddingTop: 16 }}>
        <div className="final-cta glass-card">
          <div>
            <span className="eyebrow">Choosing what comes next</span>
            <h2 className="section-title">Moving on from Scratch?</h2>
            <p>
              Compare seven coding websites by what your child wants to build
              next, from deeper blocks to real HTML, CSS, and JavaScript.
            </p>
          </div>
          <Link href="/websites-like-scratch" className="button-ghost">
            Compare Scratch alternatives
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
