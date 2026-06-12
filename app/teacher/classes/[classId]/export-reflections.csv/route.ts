import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { projectAttempts, studentProfiles } from "@/lib/db/schema";
import { normalizeLessonVariant } from "@/lib/experiments/lesson-variant";
import { normalizeProjectAttempt } from "@/lib/persistence/project-attempt-sanitizer";
import type { ProjectAttempt, ReflectionCoachCheck } from "@/lib/persistence/project-attempt-types";
import { getProjectBySlug, type LessonProjectConfig } from "@/lib/projects";
import {
  deriveReflectionCoachTeacherInsight,
  sanitizeReflectionCoachAiAnalysis,
  sanitizeReflectionCoachTeacherInsight,
} from "@/lib/reflection-coach/teacher-insights";
import type {
  ReflectionCoachDetectedSignals,
  ReflectionCoachRecommendedFocus,
  ReflectionCoachResult,
  ReflectionCoachSource,
} from "@/lib/reflection-coach/types";
import { requireTeacherClass } from "@/lib/teacher/require-teacher-class";

type RouteContext = {
  params: Promise<{
    classId: string;
  }>;
};

const CSV_COLUMNS = [
  "class_name",
  "class_variant",
  "student_display_name",
  "project_slug",
  "project_title",
  "content_version",
  "attempt_variant",
  "status",
  "progress_percent",
  "final_reflection",
  "sprout_check_count",
  "latest_sprout_result",
  "latest_sprout_follow_up_question",
  "latest_sprout_reflection_text",
  "first_sprout_reflection_text",
  "last_sprout_reflection_text",
  "sprout_sources",
  "reflection_teacher_insight",
  "reflection_misconception_risk",
  "reflection_copied_example_risk",
  "reflection_specificity",
  "reflection_personalization",
  "created_at",
  "updated_at",
] as const;

type CsvValue = string | number | Date | null | undefined;

const escapeCsvValue = (value: CsvValue) => {
  const text = value instanceof Date ? value.toISOString() : String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
};

const buildCsv = (rows: CsvValue[][]) =>
  [CSV_COLUMNS.map(escapeCsvValue).join(","), ...rows.map((row) => row.map(escapeCsvValue).join(","))].join("\r\n");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isReflectionCoachResult = (value: unknown): value is ReflectionCoachResult =>
  value === "empty" || value === "weak" || value === "almost_there" || value === "strong";

const isReflectionCoachSource = (value: unknown): value is ReflectionCoachSource =>
  value === "ai" || value === "local_fallback";

const isReflectionCoachRecommendedFocus = (
  value: unknown,
): value is ReflectionCoachRecommendedFocus =>
  value === "specificity" ||
  value === "causality" ||
  value === "concept_connection" ||
  value === "ownership" ||
  value === "make_it_yours";

const sanitizeOptionalString = (value: unknown) => (typeof value === "string" ? value : undefined);

const sanitizeReflectionCoachDetectedSignals = (
  value: unknown,
): ReflectionCoachDetectedSignals | undefined => {
  if (
    !isRecord(value) ||
    typeof value.hasSpecificEdit !== "boolean" ||
    typeof value.hasPageDetail !== "boolean" ||
    typeof value.hasActionOrChange !== "boolean" ||
    typeof value.hasConceptConnection !== "boolean" ||
    typeof value.hasReasonOrChoice !== "boolean"
  ) {
    return undefined;
  }

  return {
    hasSpecificEdit: value.hasSpecificEdit,
    hasPageDetail: value.hasPageDetail,
    hasActionOrChange: value.hasActionOrChange,
    hasConceptConnection: value.hasConceptConnection,
    hasReasonOrChoice: value.hasReasonOrChoice,
    hasCopiedExample:
      typeof value.hasCopiedExample === "boolean" ? value.hasCopiedExample : false,
  };
};

const getFallbackSproutChecks = (stateJson: unknown): ReflectionCoachCheck[] => {
  if (!isRecord(stateJson) || !Array.isArray(stateJson.reflectionCoachChecks)) {
    return [];
  }

  return stateJson.reflectionCoachChecks.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.checkedAt !== "string" ||
      typeof item.reflectionText !== "string" ||
      !isReflectionCoachResult(item.coachResult)
    ) {
      return [];
    }

    const analysis = sanitizeReflectionCoachAiAnalysis(item.analysis);
    const detectedSignals = sanitizeReflectionCoachDetectedSignals(item.detectedSignals);
    const recommendedFocus = isReflectionCoachRecommendedFocus(item.recommendedFocus)
      ? item.recommendedFocus
      : undefined;
    const teacherInsight = deriveReflectionCoachTeacherInsight({
      coachResult: item.coachResult,
      detectedSignals,
      recommendedFocus,
      analysis,
      teacherInsight: sanitizeReflectionCoachTeacherInsight(item.teacherInsight),
    });

    return [
      {
        checkedAt: item.checkedAt,
        reflectionText: item.reflectionText,
        coachResult: item.coachResult,
        coachFollowUpQuestion: sanitizeOptionalString(item.coachFollowUpQuestion),
        lessonFocus:
          item.lessonFocus === "html" ||
          item.lessonFocus === "css" ||
          item.lessonFocus === "javascript" ||
          item.lessonFocus === "general"
            ? item.lessonFocus
            : "general",
        source: isReflectionCoachSource(item.source) ? item.source : undefined,
        ...(detectedSignals ? { detectedSignals } : {}),
        ...(recommendedFocus ? { recommendedFocus } : {}),
        ...(analysis ? { analysis } : {}),
        ...(teacherInsight ? { teacherInsight } : {}),
      },
    ];
  });
};

const getTimestampMs = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const getChronologicalSproutChecks = (checks: ReflectionCoachCheck[]) =>
  checks
    .map((check, index) => ({
      check,
      index,
      timestamp: getTimestampMs(check.checkedAt),
    }))
    .sort((a, b) => {
      if (a.timestamp !== null && b.timestamp !== null) {
        return a.timestamp - b.timestamp;
      }

      if (a.timestamp !== null) {
        return -1;
      }

      if (b.timestamp !== null) {
        return 1;
      }

      return a.index - b.index;
    })
    .map(({ check }) => check);

const getLatestReflectionText = ({
  project,
  normalizedAttempt,
  fallbackExcerpt,
}: {
  project: LessonProjectConfig | null;
  normalizedAttempt: ProjectAttempt | null;
  fallbackExcerpt: string | null;
}) => {
  if (!project || !normalizedAttempt) {
    return fallbackExcerpt ?? "";
  }

  const reflectionEntries = project.steps
    .map((step) => normalizedAttempt.reflectionResponses[step.id]?.trim() ?? "")
    .filter(Boolean);

  return reflectionEntries.at(-1) ?? fallbackExcerpt ?? "";
};

const getSproutSourceSummary = (checks: ReflectionCoachCheck[]) => {
  if (checks.length === 0) {
    return "";
  }

  const aiCount = checks.filter((check) => check.source === "ai").length;
  const localFallbackCount = checks.filter((check) => check.source === "local_fallback").length;
  const unknownCount = checks.length - aiCount - localFallbackCount;
  const sourceParts = [`ai:${aiCount}`, `local_fallback:${localFallbackCount}`];

  if (unknownCount > 0) {
    sourceParts.push(`unknown:${unknownCount}`);
  }

  return sourceParts.join(";");
};

const getExportFilename = (className: string) => {
  const safeName = className
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${safeName || "class"}-reflection-export.csv`;
};

export async function GET(_request: Request, context: RouteContext) {
  const { classId } = await context.params;
  const { teacherClass } = await requireTeacherClass(classId);
  const db = getDb();

  const rows = await db
    .select({
      studentDisplayName: studentProfiles.displayName,
      projectSlug: projectAttempts.projectSlug,
      contentVersion: projectAttempts.contentVersion,
      variant: projectAttempts.variant,
      status: projectAttempts.status,
      progressPercent: projectAttempts.progressPercent,
      latestReflectionExcerpt: projectAttempts.latestReflectionExcerpt,
      stateJson: projectAttempts.stateJson,
      createdAt: projectAttempts.createdAt,
      updatedAt: projectAttempts.updatedAt,
    })
    .from(projectAttempts)
    .innerJoin(
      studentProfiles,
      and(
        eq(studentProfiles.id, projectAttempts.studentProfileId),
        eq(studentProfiles.classId, teacherClass.id),
      ),
    )
    .where(eq(projectAttempts.classId, teacherClass.id))
    .orderBy(asc(studentProfiles.displayName), asc(projectAttempts.projectSlug), asc(projectAttempts.createdAt));

  const classVariant = normalizeLessonVariant(teacherClass.defaultVariant);
  const csvRows = rows.map((row): CsvValue[] => {
    const project = getProjectBySlug(row.projectSlug) ?? null;
    const normalizedAttempt = project ? normalizeProjectAttempt(project, row.stateJson) : null;
    const attemptVariant = normalizeLessonVariant(row.variant);
    const sproutChecks = getChronologicalSproutChecks(
      normalizedAttempt?.reflectionCoachChecks ?? getFallbackSproutChecks(row.stateJson),
    );
    const firstSproutCheck = sproutChecks[0] ?? null;
    const latestSproutCheck = sproutChecks.at(-1) ?? null;

    return [
      teacherClass.name,
      classVariant,
      row.studentDisplayName,
      row.projectSlug,
      project?.projectCard.title ?? row.projectSlug,
      row.contentVersion,
      attemptVariant,
      row.status,
      row.progressPercent ?? "",
      getLatestReflectionText({
        project,
        normalizedAttempt,
        fallbackExcerpt: row.latestReflectionExcerpt,
      }),
      sproutChecks.length,
      latestSproutCheck?.coachResult ?? "",
      latestSproutCheck?.coachFollowUpQuestion ?? "",
      latestSproutCheck?.reflectionText ?? "",
      firstSproutCheck?.reflectionText ?? "",
      latestSproutCheck?.reflectionText ?? "",
      getSproutSourceSummary(sproutChecks),
      latestSproutCheck ? deriveReflectionCoachTeacherInsight(latestSproutCheck) : "",
      latestSproutCheck?.analysis?.misconceptionRisk ?? "",
      latestSproutCheck?.analysis?.copiedExampleRisk ?? "",
      latestSproutCheck?.analysis?.specificity ?? "",
      latestSproutCheck?.analysis?.personalization ?? "",
      row.createdAt,
      row.updatedAt,
    ];
  });

  const csv = buildCsv(csvRows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getExportFilename(teacherClass.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
