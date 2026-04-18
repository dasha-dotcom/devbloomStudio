"use client";

import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { moodSwitchProject } from "@/lib/projects";

export default function MoodSwitchProjectPage() {
  return <LessonPageShell project={moodSwitchProject} />;
}
