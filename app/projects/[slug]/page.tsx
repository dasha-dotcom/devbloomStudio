import { notFound } from "next/navigation";

import { ProjectLessonPage as ProjectLessonClientPage } from "@/components/lesson/project-lesson-page";
import { getAllProjects, getProjectBySlug } from "@/lib/projects";

type ProjectLessonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllProjects().map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectLessonPage({ params }: ProjectLessonPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectLessonClientPage slug={slug} />;
}
