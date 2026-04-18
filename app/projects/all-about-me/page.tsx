"use client";

import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { allAboutMeProject } from "@/lib/projects";

export default function AllAboutMeLessonPage() {
  return <LessonPageShell project={allAboutMeProject} />;
}
