import { NextResponse } from "next/server";

import { normalizeLessonVariant } from "@/lib/experiments/lesson-variant";
import { getProjectBySlug } from "@/lib/projects";
import { evaluateReflectionForCoach } from "@/lib/reflection-coach/evaluate-reflection";
import {
  evaluateReflectionWithAi,
  hasReflectionCoachAiConfig,
} from "@/lib/reflection-coach/ai-coach-client";
import { applyLocalMisconceptionOverlay } from "@/lib/reflection-coach/misconception-detection";
import type {
  ReflectionCoachApiResponse,
  ReflectionCoachFallbackDebugDetail,
  ReflectionCoachFallbackReason,
  ReflectionCoachFocus,
} from "@/lib/reflection-coach/types";

type ReflectionCoachRequestBody = {
  projectSlug?: unknown;
  lessonTitle?: unknown;
  reflectionPrompt?: unknown;
  reflectionPlaceholder?: unknown;
  lessonFocus?: unknown;
  reflectionText?: unknown;
  localEvaluation?: unknown;
  variant?: unknown;
  priorAiCheckCount?: unknown;
};

const MAX_REFLECTION_TEXT_LENGTH = 1000;
const MAX_LESSON_TITLE_LENGTH = 160;
const MAX_REFLECTION_PROMPT_LENGTH = 400;
const MAX_REFLECTION_PLACEHOLDER_LENGTH = 400;
const DEFAULT_MAX_AI_CHECKS_PER_ATTEMPT = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_HOUR_WINDOW_MS = 60 * 60 * 1000;
const MAX_AI_REQUESTS_PER_MINUTE_PER_IP = 5;
const MAX_AI_REQUESTS_PER_HOUR_PER_IP = 20;

type IpRateLimitBucket = {
  minuteWindowStartedAt: number;
  minuteCount: number;
  hourWindowStartedAt: number;
  hourCount: number;
};

const ipRateLimitBuckets = new Map<string, IpRateLimitBucket>();

const isReflectionCoachFocus = (value: unknown): value is ReflectionCoachFocus =>
  value === "html" || value === "css" || value === "javascript" || value === "general";

const getSafeOptionalString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") {
    return undefined;
  }

  return value.slice(0, maxLength);
};

const getSafeReflectionText = (value: unknown) =>
  typeof value === "string" ? value.slice(0, MAX_REFLECTION_TEXT_LENGTH) : "";

const isReflectionCoachAiEnabled = () => process.env.REFLECTION_COACH_AI_ENABLED === "true";

const getMaxAiChecksPerAttempt = () => {
  const configuredValue = process.env.REFLECTION_COACH_MAX_AI_CHECKS_PER_ATTEMPT?.trim();

  if (!configuredValue) {
    return DEFAULT_MAX_AI_CHECKS_PER_ATTEMPT;
  }

  const parsedValue = Number.parseInt(configuredValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return DEFAULT_MAX_AI_CHECKS_PER_ATTEMPT;
  }

  return parsedValue;
};

const getPriorAiCheckCount = (value: unknown) => {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : 0;

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return Math.floor(parsedValue);
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
};

const pruneOldRateLimitBuckets = (now: number) => {
  if (ipRateLimitBuckets.size <= 1000) {
    return;
  }

  for (const [ip, bucket] of ipRateLimitBuckets) {
    if (now - bucket.hourWindowStartedAt > RATE_LIMIT_HOUR_WINDOW_MS) {
      ipRateLimitBuckets.delete(ip);
    }
  }
};

const isRateLimited = (ip: string, now = Date.now()) => {
  pruneOldRateLimitBuckets(now);

  const bucket = ipRateLimitBuckets.get(ip) ?? {
    minuteWindowStartedAt: now,
    minuteCount: 0,
    hourWindowStartedAt: now,
    hourCount: 0,
  };

  if (now - bucket.minuteWindowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    bucket.minuteWindowStartedAt = now;
    bucket.minuteCount = 0;
  }

  if (now - bucket.hourWindowStartedAt >= RATE_LIMIT_HOUR_WINDOW_MS) {
    bucket.hourWindowStartedAt = now;
    bucket.hourCount = 0;
  }

  if (
    bucket.minuteCount >= MAX_AI_REQUESTS_PER_MINUTE_PER_IP ||
    bucket.hourCount >= MAX_AI_REQUESTS_PER_HOUR_PER_IP
  ) {
    ipRateLimitBuckets.set(ip, bucket);
    return true;
  }

  bucket.minuteCount += 1;
  bucket.hourCount += 1;
  ipRateLimitBuckets.set(ip, bucket);
  return false;
};

const getFallbackResponse = (
  body: ReflectionCoachRequestBody,
  lessonFocus: ReflectionCoachFocus,
  fallbackReason?: ReflectionCoachFallbackReason,
  fallbackDebugDetail?: ReflectionCoachFallbackDebugDetail,
): ReflectionCoachApiResponse => {
  const reflectionText = getSafeReflectionText(body.reflectionText);
  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug : undefined;
  const localEvaluation = evaluateReflectionForCoach({
    reflectionText,
    projectSlug,
    reflectionPrompt: getSafeOptionalString(body.reflectionPrompt, MAX_REFLECTION_PROMPT_LENGTH),
    lessonFocus,
  });

  return {
    ...applyLocalMisconceptionOverlay({
      evaluation: localEvaluation,
      reflectionText,
      projectSlug,
    }),
    source: "local_fallback",
    ...(process.env.NODE_ENV !== "production" && fallbackReason ? { fallbackReason } : {}),
    ...(process.env.NODE_ENV !== "production" && fallbackDebugDetail
      ? { fallbackDebugDetail }
      : {}),
  };
};

export async function POST(request: Request) {
  let body: ReflectionCoachRequestBody;

  try {
    body = (await request.json()) as ReflectionCoachRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.reflectionText !== "string") {
    return NextResponse.json({ error: "Reflection text is required." }, { status: 400 });
  }

  const projectSlug = typeof body.projectSlug === "string" ? body.projectSlug : "";
  const project = getProjectBySlug(projectSlug);
  const variant = normalizeLessonVariant(body.variant);
  const rawLessonFocus = body.lessonFocus;
  const hasValidLessonFocus = isReflectionCoachFocus(rawLessonFocus);
  const lessonFocus: ReflectionCoachFocus = hasValidLessonFocus ? rawLessonFocus : "general";
  const reflectionText = body.reflectionText.slice(0, MAX_REFLECTION_TEXT_LENGTH);

  if (!project) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "unknown_project"),
    );
  }

  if (!hasValidLessonFocus) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "invalid_lesson_focus"),
    );
  }

  if (body.reflectionText.length > MAX_REFLECTION_TEXT_LENGTH) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "reflection_too_long"),
    );
  }

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

  if (!isReflectionCoachAiEnabled()) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "ai_disabled"),
    );
  }

  if (!hasReflectionCoachAiConfig()) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "missing_config"),
    );
  }

  if (!reflectionText.trim()) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "empty_reflection"),
    );
  }

  if (getPriorAiCheckCount(body.priorAiCheckCount) >= getMaxAiChecksPerAttempt()) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "attempt_ai_limit_reached"),
    );
  }

  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      getFallbackResponse({ ...body, reflectionText }, lessonFocus, "rate_limited"),
    );
  }

  const aiResult = await evaluateReflectionWithAi({
    projectSlug: project.slug,
    projectTitle: project.projectCard.title,
    lessonTitle: getSafeOptionalString(body.lessonTitle, MAX_LESSON_TITLE_LENGTH),
    reflectionPrompt: getSafeOptionalString(body.reflectionPrompt, MAX_REFLECTION_PROMPT_LENGTH),
    reflectionPlaceholder: getSafeOptionalString(
      body.reflectionPlaceholder,
      MAX_REFLECTION_PLACEHOLDER_LENGTH,
    ),
    lessonFocus,
    reflectionText,
    localEvaluation,
  });

  if (!aiResult.evaluation) {
    return NextResponse.json(
      getFallbackResponse(
        { ...body, reflectionText },
        lessonFocus,
        aiResult.fallbackReason,
        aiResult.fallbackDebugDetail,
      ),
    );
  }

  return NextResponse.json({
    ...aiResult.evaluation,
    source: "ai",
  } satisfies ReflectionCoachApiResponse);
}
