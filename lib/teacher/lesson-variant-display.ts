import { normalizeLessonVariant, type LessonVariant } from "@/lib/experiments/lesson-variant";

type LessonVariantDisplay = {
  variant: LessonVariant;
  classLabel: string;
  attemptLabel: string;
};

export const getLessonVariantDisplay = (value: unknown): LessonVariantDisplay => {
  const variant = normalizeLessonVariant(value);

  if (variant === "ai_coach") {
    return {
      variant,
      classLabel: "Sprout Reflection Coach",
      attemptLabel: "Sprout Coach",
    };
  }

  return {
    variant,
    classLabel: "Standard Reflection",
    attemptLabel: "Standard",
  };
};
