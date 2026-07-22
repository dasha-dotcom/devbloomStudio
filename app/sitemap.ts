import type { MetadataRoute } from "next";

import { getAllProjects, getProjectHref } from "@/lib/projects";

const siteUrl = "https://devbloom-studio.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const projectPages = getAllProjects().map((project) => ({
    url: `${siteUrl}${getProjectHref(project.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/teachers`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...projectPages,
  ];
}
