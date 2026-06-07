import { evaluateAllAboutMeReflection } from "./all-about-me";
import { evaluateBuildYourOwnMiniSiteReflection } from "./build-your-own-mini-site";
import { evaluateMoodSwitchReflection } from "./mood-switch";
import { evaluateVibePageReflection } from "./vibe-page";
import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachEvaluation,
} from "../types";

export type ReflectionCoachRubricInput = {
  normalizedValue: string;
  detectedSignals: ReflectionCoachDetectedSignals;
};

export type ReflectionCoachRubricEvaluation = Pick<
  ReflectionCoachEvaluation,
  "coachResult" | "recommendedFocus" | "lessonFocus" | "followUpQuestion" | "positiveMessage"
>;

export type ReflectionCoachRubricEvaluator = (
  input: ReflectionCoachRubricInput,
) => ReflectionCoachRubricEvaluation;

const rubricEvaluators: Record<string, ReflectionCoachRubricEvaluator> = {
  "all-about-me": evaluateAllAboutMeReflection,
  "vibe-page": evaluateVibePageReflection,
  "mood-switch": evaluateMoodSwitchReflection,
  "build-your-own-mini-site": evaluateBuildYourOwnMiniSiteReflection,
};

export const getReflectionRubric = (projectSlug?: string) =>
  projectSlug ? rubricEvaluators[projectSlug] ?? null : null;
