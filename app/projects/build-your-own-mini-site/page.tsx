"use client";

import { LessonPageShell } from "@/components/lesson/lesson-page-shell";
import { buildYourOwnMiniSiteProject } from "@/lib/projects";

export default function BuildYourOwnMiniSitePage() {
  return <LessonPageShell project={buildYourOwnMiniSiteProject} />;
}
