import {
  getAllProjectCards,
  getProjectBySlug,
  getProjectHref,
  lessonProjects,
} from "@/lib/projects/index";

const isNonEmptyString = (value: string | undefined | null) =>
  typeof value === "string" && value.trim().length > 0;

export function getProjectIntegrityIssues() {
  const issues: string[] = [];
  const seenSlugs = new Set<string>();

  for (const project of lessonProjects) {
    if (!isNonEmptyString(project.slug)) {
      issues.push("Found a project with an empty slug.");
    }

    if (seenSlugs.has(project.slug)) {
      issues.push(`Duplicate project slug "${project.slug}".`);
    }

    seenSlugs.add(project.slug);

    if (!isNonEmptyString(project.contentVersion)) {
      issues.push(`Project "${project.slug}" is missing contentVersion.`);
    }

    if (project.steps.length === 0) {
      issues.push(`Project "${project.slug}" must have at least one step.`);
    }

    const seenStepIds = new Set<string>();
    const seenStepOrders = new Set<number>();

    project.steps.forEach((step, index) => {
      if (!isNonEmptyString(step.id)) {
        issues.push(`Project "${project.slug}" has a step with an empty id at index ${index}.`);
      }

      if (seenStepIds.has(step.id)) {
        issues.push(`Project "${project.slug}" has duplicate step id "${step.id}".`);
      }

      seenStepIds.add(step.id);

      if (seenStepOrders.has(step.order)) {
        issues.push(`Project "${project.slug}" has duplicate step order ${step.order}.`);
      }

      seenStepOrders.add(step.order);

      if (step.order !== index + 1) {
        issues.push(
          `Project "${project.slug}" step "${step.id}" has order ${step.order}, expected ${index + 1}.`,
        );
      }
    });

    const card = project.projectCard;

    if (!isNonEmptyString(card.title) || !isNonEmptyString(card.description)) {
      issues.push(`Project "${project.slug}" is missing required project card copy.`);
    }
  }

  for (const card of getAllProjectCards()) {
    if (card.locked) {
      continue;
    }

    if (!card.href.startsWith("/projects/")) {
      issues.push(`Project card "${card.title}" has an unexpected href "${card.href}".`);
      continue;
    }

    const slug = card.href.slice("/projects/".length);
    const project = getProjectBySlug(slug);

    if (!project) {
      issues.push(`Project card "${card.title}" points to missing project slug "${slug}".`);
      continue;
    }

    if (card.href !== getProjectHref(project.slug)) {
      issues.push(`Project card "${card.title}" has a mismatched href "${card.href}".`);
    }
  }

  return issues;
}

export function validateProjectsOrThrow() {
  const issues = getProjectIntegrityIssues();

  if (issues.length === 0) {
    return;
  }

  throw new Error(`Project validation failed:\n- ${issues.join("\n- ")}`);
}
