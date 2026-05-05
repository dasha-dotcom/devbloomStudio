import { allAboutMeProject } from "@/lib/projects/all-about-me";
import { buildYourOwnMiniSiteProject } from "@/lib/projects/build-your-own-mini-site";
import { moodSwitchProject } from "@/lib/projects/mood-switch";
import type { ProjectCardData } from "@/lib/projects/types";
import { vibePageProject } from "@/lib/projects/vibe-page";

export { allAboutMeProject } from "@/lib/projects/all-about-me";
export { buildYourOwnMiniSiteProject } from "@/lib/projects/build-your-own-mini-site";
export { moodSwitchProject } from "@/lib/projects/mood-switch";
export { vibePageProject } from "@/lib/projects/vibe-page";
export * from "@/lib/projects/starter-code";
export * from "@/lib/projects/types";

export const lessonProjects = [
  allAboutMeProject,
  vibePageProject,
  moodSwitchProject,
  buildYourOwnMiniSiteProject,
];

export const getProjectHref = (slug: string) => `/projects/${slug}`;

const createProjectRegistry = () => {
  const registry = new Map(lessonProjects.map((project) => [project.slug, project]));

  if (registry.size !== lessonProjects.length) {
    throw new Error("Duplicate project slug detected while building the project registry.");
  }

  return registry;
};

const projectBySlug = createProjectRegistry();

const lessonProjectCards: ProjectCardData[] = lessonProjects.map((project) => ({
  ...project.projectCard,
  href: getProjectHref(project.slug),
}));

const upcomingProjectCards: ProjectCardData[] = [
  {
    title: "Pet Fan Club",
    description:
      "Build a page for a real or imaginary pet with fun facts, favorite snacks, and a playful design.",
    level: "Coming soon",
    whatYouMake: "A pet spotlight site",
    time: "25 min",
    href: "#",
    artGradient: "linear-gradient(135deg, #9be5c0, #6ecbff 55%, #a98cff)",
    locked: true,
  },
  {
    title: "Dream Room Moodboard",
    description:
      "Design a webpage that shows your dream room style, colors, and inspiration in a creative layout.",
    level: "Coming soon",
    whatYouMake: "A moodboard page",
    time: "30 min",
    href: "#",
    artGradient: "linear-gradient(135deg, #ffb0d4, #ffd981 48%, #8ad4b6)",
    locked: true,
  },
];

const lessonProjectCardBySlug = new Map(
  lessonProjects.map((project, index) => [project.slug, lessonProjectCards[index]]),
);

export const getAllProjects = () => lessonProjects;

export const getProjectBySlug = (slug: string) => projectBySlug.get(slug);

export const getProjectCardData = (slug: string) => lessonProjectCardBySlug.get(slug);

export const getAllProjectCards = () => [...lessonProjectCards, ...upcomingProjectCards];

export const projectCards = getAllProjectCards();
