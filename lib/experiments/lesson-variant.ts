export type LessonVariant = "control" | "ai_coach";

export const isLessonVariant = (value: unknown): value is LessonVariant =>
  value === "control" || value === "ai_coach";

export const normalizeLessonVariant = (value: unknown): LessonVariant =>
  value === "ai_coach" ? "ai_coach" : "control";
