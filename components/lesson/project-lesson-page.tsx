"use client";

import { notFound } from "next/navigation";

import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { getProjectBySlug } from "@/lib/projects";

type ProjectLessonPageProps = {
  slug: string;
};

export function ProjectLessonPage({ slug }: ProjectLessonPageProps) {
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <LessonPageShell project={project} />;
}
