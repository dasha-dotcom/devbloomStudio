import type { LessonAllowNextWhen, LessonStep } from "@/lib/projects";

export type FeedbackState = "pass" | "close" | "notYet";

export type CheckpointAnswers = Record<string, number>;

export type StepFeedbackContext = {
  step: LessonStep;
  code: string;
  starterCode: string;
  stepStartCode: string;
  editorCode: string;
  starterEditorCode: string;
  stepStartEditorCode: string;
  autoCheckRequested: boolean;
  checkpointAnswers: CheckpointAnswers;
  checkpointSubmitted: boolean;
  reflectionResponse: string;
};

export type StepFeedbackResult = {
  state: FeedbackState;
  message: string;
  canGoNext: boolean;
  needsManualCheck: boolean;
  isPending: boolean;
  allowNextWhen: LessonAllowNextWhen;
};
