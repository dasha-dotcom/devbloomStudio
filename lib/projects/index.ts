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

export const projectCards: ProjectCardData[] = [
  {
    title: "Make a Page About Something You Like",
    description:
      "Pick your topic and build a real mini website about it. Learn HTML with headings, paragraphs, lists, images, and custom colors.",
    level: "Beginner",
    whatYouMake: "A mini webpage about your favorite thing",
    time: "20-25 min",
    href: "/projects/all-about-me",
    artGradient: "linear-gradient(135deg, #ffd981, #ff8e78 52%, #6ecbff)",
  },
  {
    title: "Vibe Page",
    description:
      "Style a mini webpage with real CSS and discover how colors, text, spacing, and card design can completely change the mood.",
    level: "Beginner+",
    whatYouMake: "A mood-driven mini webpage",
    time: "20-25 min",
    href: "/projects/vibe-page",
    artGradient: "linear-gradient(135deg, #7ed0ff, #ffd86d 46%, #ff8db3)",
  },
  {
    title: "Mood Switch",
    description:
      "Build your first JavaScript interaction by making one button switch a mini webpage between ocean and space moods.",
    level: "Beginner+",
    whatYouMake: "An interactive mood toggle page",
    time: "20-25 min",
    href: "/projects/mood-switch",
    artGradient: "linear-gradient(135deg, #63d4ff, #133a8a 52%, #25164f 78%, #ff8ac8)",
  },
  {
    title: "Build Your Own Mini Site",
    description:
      "Create a final remix project by choosing a topic, visual vibe, and interaction, then personalize the HTML, CSS, and JavaScript step by step.",
    level: "Capstone",
    whatYouMake: "A one-page creative mini site",
    time: "25-30 min",
    href: "/projects/build-your-own-mini-site",
    artGradient: "linear-gradient(135deg, #6ee7d7, #65b8ff 34%, #a67dff 68%, #ffab7a)",
  },
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
