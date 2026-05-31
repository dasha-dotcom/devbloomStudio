import { NextResponse } from "next/server";

import { normalizeLessonVariant } from "@/lib/experiments/lesson-variant";
import { getProjectBySlug } from "@/lib/projects";
import { evaluateReflectionForCoach } from "@/lib/reflection-coach/evaluate-reflection";
import {
  evaluateReflectionWithAi,
  hasReflectionCoachAiConfig,
} from "@/lib/reflection-coach/ai-coach-client";
import type {
  ReflectionCoachApiResponse,
  ReflectionCoachFallbackReason,
  ReflectionCoachFocus,
} from "@/lib/reflection-coach/types";

type ReflectionCoachRequestBody = {
  projectSlug?: unknown;
  lessonTitle?: unknown;
  reflectionPrompt?: unknown;
  lessonFocus?: unknown;
  reflectionText?: unknown;
  localEvaluation?: unknown;
  variant?: unknown;
};

const MAX_REFLECTION_TEXT_LENGTH = 3000;
const MAX_LESSON_TITLE_LENGTH = 160;
const MAX_REFLECTION_PROMPT_LENGTH = 400;

const isReflectionCoachFocus = (value: unknown): value is ReflectionCoachFocus =>
  value === "html" || value === "css" || value === "javascript" || value === "general";

const getSafeOptionalString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.slice(0, maxLength);
};

const getFallbackResponse = (
  body: ReflectionCoachRequestBody,
  lessonFocus: ReflectionCoachFocus,
  fallbackReason?: ReflectionCoachFallbackReason,
): ReflectionCoachApiResponse => ({
  ...evaluateReflectionForCoach({
    reflectionText: String(body.reflectionText ?? ""),
    projectSlug: typeof body.projectSlug === "string" ? body.projectSlug : undefined,
    reflectionPrompt: getSafeOptionalString(body.reflectionPrompt, MAX_REFLECTION_PROMPT_LENGTH),
    lessonFocus,
  }),
  source: "local_fallback",
  ...(process.env.NODE_ENV !== "production" && fallbackReason ? { fallbackReason } : {}),
});

const warnFallbackReasonInDevelopment = (fallbackReason: ReflectionCoachFallbackReason) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Reflection coach AI fallback:", fallbackReason);
  }
};

export async function POST(request: Request) {
  let body: ReflectionCoachRequestBody;

  try {
    body = (await request.json()) as ReflectionCoachRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug : "";
  const project = getProjectBySlug(projectSlug);

  if (!project) {
    return NextResponse.json({ error: "Unknown project." }, { status: 400 });
  }

  if (typeof body.reflectionText !== "string") {
    return NextResponse.json({ error: "Reflection text is required." }, { status: 400 });
  }

  const variant = normalizeLessonVariant(body.variant);
  const reflectionText = body.reflectionText.slice(0, MAX_REFLECTION_TEXT_LENGTH);
  const lessonFocus = isReflectionCoachFocus(body.lessonFocus) ? body.lessonFocus : "general";
  const localEvaluation = evaluateReflectionForCoach({
    reflectionText,
    projectSlug: project.slug,
    reflectionPrompt: getSafeOptionalString(body.reflectionPrompt, MAX_REFLECTION_PROMPT_LENGTH),
    lessonFocus,
  });

  if (variant !== "ai_coach") {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "not_ai_coach_variant"),
    );
  }

  if (!hasReflectionCoachAiConfig()) {
    warnFallbackReasonInDevelopment("missing_config");
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "missing_config"),
    );
  }

  if (!reflectionText.trim()) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "empty_reflection"),
    );
  }

  const aiResult = await evaluateReflectionWithAi({
    projectSlug: project.slug,
    projectTitle: project.projectCard.title,
    lessonTitle: getSafeOptionalString(body.lessonTitle, MAX_LESSON_TITLE_LENGTH),
    reflectionPrompt: getSafeOptionalString(body.reflectionPrompt, MAX_REFLECTION_PROMPT_LENGTH),
    lessonFocus,
    reflectionText,
    localEvaluation,
  });

  if (!aiResult.evaluation) {
    warnFallbackReasonInDevelopment(aiResult.fallbackReason);
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, aiResult.fallbackReason),
    );
  }

  return NextResponse.json({
    ...aiResult.evaluation,
    source: "ai",
  } satisfies ReflectionCoachApiResponse);
}
