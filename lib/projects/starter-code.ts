import type { BuilderSelections, LessonProjectConfig, LessonStep } from "@/lib/projects/types";

export const getDefaultBuilderSelections = (
  project: LessonProjectConfig,
): BuilderSelections =>
  Object.fromEntries(
    project.builder?.questions.map((question) => [question.id, question.defaultOptionId]) ?? [],
  );

export const getStarterCode = (
  project: LessonProjectConfig,
  step: LessonStep,
  builderSelections: BuilderSelections = {},
) => project.getStarterCode?.({ step, builderSelections }) ?? project.starterCode;

export const getStarterImageId = (project: LessonProjectConfig, starterCode: string) =>
  starterCode.match(/src="image:([^"]+)"/)?.[1] ?? project.defaultImageId ?? "";
