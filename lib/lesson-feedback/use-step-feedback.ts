"use client";

import { useMemo } from "react";

import { evaluateStepFeedback } from "@/lib/lesson-feedback/evaluate-step";
import type { StepFeedbackContext } from "@/lib/lesson-feedback/types";

export function useStepFeedback(context: StepFeedbackContext) {
  return useMemo(() => evaluateStepFeedback(context), [context]);
}
