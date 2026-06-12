export type ReflectionCoachResult = "empty" | "weak" | "almost_there" | "strong";

export type ReflectionCoachFocus = "html" | "css" | "javascript" | "general";

export type ReflectionCoachSource = "ai" | "local_fallback";

export type ReflectionCoachFallbackReason =
  | "ai_disabled"
  | "missing_config"
  | "empty_reflection"
  | "not_ai_coach_variant"
  | "unknown_project"
  | "reflection_too_long"
  | "attempt_ai_limit_reached"
  | "rate_limited"
  | "provider_http_error"
  | "missing_message_content"
  | "invalid_json"
  | "output_too_long"
  | "invalid_coach_result"
  | "invalid_lesson_focus"
  | "missing_required_field"
  | "follow_up_too_long"
  | "positive_message_too_long"
  | "multiple_questions"
  | "missing_question_mark"
  | "positive_message_contains_question"
  | "invalid_analysis"
  | "teacher_insight_too_long"
  | "harsh_language"
  | "code_like_output"
  | "rewritten_reflection_field"
  | "status_mismatch"
  | "unknown_validation_error";

export type ReflectionCoachFallbackDebugDetail =
  | "coachResult"
  | "detectedSignals"
  | "recommendedFocus"
  | "lessonFocus"
  | "messageShape";

export type ReflectionCoachRecommendedFocus =
  | "specificity"
  | "causality"
  | "concept_connection"
  | "ownership"
  | "make_it_yours";

export type ReflectionCoachDetectedSignals = {
  hasSpecificEdit: boolean;
  hasPageDetail: boolean;
  hasActionOrChange: boolean;
  hasConceptConnection: boolean;
  hasReasonOrChoice: boolean;
  hasCopiedExample: boolean;
};

export type ReflectionCoachAiSpecificity =
  | "empty"
  | "generic"
  | "somewhat_specific"
  | "specific";

export type ReflectionCoachAiPersonalization =
  | "none"
  | "generic_example"
  | "some_personal_detail"
  | "clearly_personalized";

export type ReflectionCoachAiMisconceptionRisk =
  | "none"
  | "html_css_confusion"
  | "html_js_confusion"
  | "css_js_confusion"
  | "event_result_confusion"
  | "other";

export type ReflectionCoachAiCopiedExampleRisk = "none" | "possible" | "likely";

export type ReflectionCoachAiAnalysis = {
  specificity: ReflectionCoachAiSpecificity;
  personalization: ReflectionCoachAiPersonalization;
  misconceptionRisk: ReflectionCoachAiMisconceptionRisk;
  misconceptionNote?: string;
  inferredStudentUnderstanding?: string[];
  missingConcepts?: string[];
  copiedExampleRisk: ReflectionCoachAiCopiedExampleRisk;
};

export type ReflectionCoachEvaluationInput = {
  reflectionText: string;
  projectSlug?: string;
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
  analysis?: ReflectionCoachAiAnalysis;
  teacherInsight?: string;
};

export type ReflectionCoachApiResponse = ReflectionCoachEvaluation & {
  source: ReflectionCoachSource;
  fallbackReason?: ReflectionCoachFallbackReason;
  fallbackDebugDetail?: ReflectionCoachFallbackDebugDetail;
};
