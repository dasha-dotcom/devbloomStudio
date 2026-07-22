import { launchStudentProjectAttempt } from "@/app/student/projects/actions";
import type { LessonProjectConfig } from "@/lib/projects";

type StudentProjectLaunchCardProps = {
  project: LessonProjectConfig;
  isRecommended?: boolean;
};

export function StudentProjectLaunchCard({
  project,
  isRecommended = false,
}: StudentProjectLaunchCardProps) {
  const launchAttemptForProject = launchStudentProjectAttempt.bind(null, project.slug);

  return (
    <article className={`project-card ${project.projectCard.locked ? "locked" : ""}`}>
      <div className="project-art" style={{ background: project.projectCard.artGradient }}>
        <h4>{project.projectCard.title}</h4>
        <p>{project.projectCard.whatYouMake}</p>
        <div className="art-glow" />
      </div>

      <div className="pill-row">
        {isRecommended ? <span className="pill project-card-recommendation">Start here</span> : null}
        <span className="pill">{project.projectCard.level}</span>
        <span className="pill">{project.projectCard.time}</span>
      </div>

      <div>
        <h3>{project.projectCard.title}</h3>
        <p>{project.projectCard.description}</p>
      </div>

      <form action={launchAttemptForProject}>
        <button type="submit" className="button">
          Open project
        </button>
      </form>
    </article>
  );
}
