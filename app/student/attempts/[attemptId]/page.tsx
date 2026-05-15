import { ProjectLessonPage } from "@/components/lesson/project-lesson-page";
import { requireStudentProjectAttempt } from "@/lib/student/require-student-project-attempt";

type StudentAttemptPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

export default async function StudentAttemptPage({ params }: StudentAttemptPageProps) {
  const { attemptId } = await params;
  const { project, attempt } = await requireStudentProjectAttempt(attemptId);

  return (
    <ProjectLessonPage
      slug={project.slug}
      projectsHref="/student/projects"
      autosaveDelayMs={2000}
      navMode="student"
      serverAttempt={{
        attemptId,
        initialAttempt: attempt,
      }}
    />
  );
}
