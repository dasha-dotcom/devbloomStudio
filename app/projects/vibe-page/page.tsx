"use client";

import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { vibePageProject } from "@/lib/projects";

export default function VibePageLessonPage() {
  return <LessonPageShell project={vibePageProject} />;
}
