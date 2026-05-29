export type ReflectionCoachResult = "empty" | "weak" | "strong";

export type ReflectionCoachFocus = "html" | "css" | "javascript" | "general";

export type ReflectionCoachRecommendedFocus =
  | "specificity"
  | "causality"
  | "concept_connection"
  | "ownership";

export type ReflectionCoachDetectedSignals = {
  hasSpecificEdit: boolean;
  hasPageDetail: boolean;
  hasActionOrChange: boolean;
  hasConceptConnection: boolean;
  hasReasonOrChoice: boolean;
};

export type ReflectionCoachEvaluationInput = {
  reflectionText: string;
  reflectionPrompt?: string;
  lessonFocus?: ReflectionCoachFocus;
};

export type ReflectionCoachEvaluation = {
  coachResult: ReflectionCoachResult;
  detectedSignals: ReflectionCoachDetectedSignals;
  recommendedFocus: ReflectionCoachRecommendedFocus;
  lessonFocus: ReflectionCoachFocus;
  followUpQuestion?: string;
  positiveMessage?: string;
};
