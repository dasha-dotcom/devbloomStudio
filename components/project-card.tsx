import Link from "next/link";
import type { ProjectCardData } from "@/lib/projects";

type ProjectCardProps = {
  project: ProjectCardData;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className={`project-card ${project.locked ? "locked" : ""}`}>
      <div
        className="project-art"
        style={{ background: project.artGradient }}
      >
        <h4>{project.title}</h4>
        <p>{project.whatYouMake}</p>
        <div className="art-glow" />
      </div>

      <div className="pill-row">
        <span className="pill">{project.level}</span>
        <span className="pill">{project.time}</span>
      </div>

      <div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>

      {project.locked ? (
        <button className="button-ghost" type="button" disabled>
          Coming soon
        </button>
      ) : (
        <Link href={project.href} className="button">
          Start project
        </Link>
      )}
    </article>
  );
}
