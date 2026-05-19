export type ProjectCardData = {
  title: string;
  description: string;
  level: string;
  whatYouMake: string;
  time: string;
  href: string;
  artGradient: string;
  locked?: boolean;
};

export type ProjectLibraryCard = Omit<ProjectCardData, "href">;

export type LessonStep = {
  id: string;
  order: number;
  shortTitle: string;
  sidebarCopy: string;
  countsTowardProgress?: boolean;
  kicker: string;
  title: string;
  body: string;
  hint?: string;
  tip?: {
    title?: string;
    short: string;
    long?: string;
  };
  example?: string;
  challenge?: string;
  editorFocus: {
    label: string;
    matchText?: string;
    helperText?: string;
  };
  textEntry?: {
    label: string;
    placeholder?: string;
    note?: string;
    maxLength?: number;
    passState?: "nonEmpty" | "substantiveReflection";
    autoFocus?: boolean;
  };
  prediction?: {
    question: string;
    options: string[];
    answerIndex: number;
    positiveFeedback?: string;
    neutralFeedback?: string;
  };
  activity?: {
    type: "selection";
    title: string;
    body: string;
    questions: Array<{
      id: string;
      title: string;
      options: string[];
      answerIndex: number;
      positiveFeedback?: string;
      neutralFeedback?: string;
    }>;
  };
  feedbackMode?: LessonFeedbackMode;
  isGate?: boolean;
  allowNextWhen?: LessonAllowNextWhen;
  checkBehavior?: LessonCheckBehavior;
  passMessage?: string;
  closeMessage?: string;
  notYetMessage?: string;
  successCriteria?: LessonSuccessCriteria;
  checkpoint?: LessonCheckpointConfig;
  reflectionPrompt?: string;
  reflectionPlaceholder?: string;
  checklist?: string[];
  showEditor: boolean;
  editorReadOnly?: boolean;
  showImagePicker?: boolean;
  showThemePicker?: boolean;
  showBuilder?: boolean;
  editorTabs?: LessonEditorTab[];
  defaultEditorTabId?: string;
};

export type LessonFeedbackMode = "none" | "autoCheck" | "checkpoint" | "reflection";

export type LessonAllowNextWhen = "always" | "pass" | "answered";

export type LessonCheckBehavior = "live" | "manual";

export type LessonCheckpointQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
};

export type LessonCheckpointConfig = {
  title: string;
  body: string;
  questions: LessonCheckpointQuestion[];
  submitLabel?: string;
};

export type LessonTargetRegion = {
  startAfter: string;
  endBefore: string;
};

export type LessonSuccessCriteria =
  | {
      type: "changedFromStarter";
    }
  | {
      type: "changedFromStepStart";
    }
  | {
      type: "changedInTargetRegion";
      region: LessonTargetRegion;
    }
  | {
      type: "codeIncludes";
      value: string;
    }
  | {
      type: "codeIncludesAny";
      values: string[];
    }
  | {
      type: "codeExcludes";
      value: string;
    }
  | {
      type: "allOf";
      criteria: LessonSuccessCriteria[];
    }
  | {
      type: "anyOf";
      criteria: LessonSuccessCriteria[];
    };

export type LessonEditorTab = {
  id: string;
  label: string;
  language: string;
  badgeLabel: string;
};

export type ThemeOption = {
  id: string;
  name: string;
  description: string;
  swatches: string[];
  previewGradient: string;
  cssVars: Record<string, string>;
};

export type ImageOption = {
  id: string;
  name: string;
  description: string;
  alt: string;
  src: string;
};

export type LessonSidebarMeta = {
  eyebrow: string;
  title: string;
  description: string;
};

export type FinishScreenContent = {
  eyebrow: string;
  title: string;
  body: string;
  learnedBadges: string[];
};

export type LessonIntroCard = {
  title: string;
  body: string;
  pills: string[];
};

export type BuilderSelections = Record<string, string>;

export type BuilderOption = {
  id: string;
  label: string;
  description: string;
  emoji?: string;
  accentColor?: string;
  previewGradient?: string;
};

export type BuilderQuestion = {
  id: string;
  title: string;
  body: string;
  defaultOptionId: string;
  options: BuilderOption[];
};

export type LessonBuilderConfig = {
  title: string;
  body: string;
  questions: BuilderQuestion[];
};

export type LessonOnboardingTourStep = {
  targetId: string;
  title: string;
  body: string;
};

export type LessonOnboardingTourConfig = {
  enabled: boolean;
  triggerStepIndex: number;
  showEveryTime?: boolean;
  steps: LessonOnboardingTourStep[];
};

export type LessonProjectConfig = {
  slug: string;
  contentVersion: string;
  editorLanguage: string;
  editorBadgeLabel: string;
  projectCard: ProjectLibraryCard;
  starterCode: string;
  resetBehavior?: "full" | "active-tab";
  builder?: LessonBuilderConfig;
  getStarterCode?: (state: { step: LessonStep; builderSelections: BuilderSelections }) => string;
  steps: LessonStep[];
  sidebar: LessonSidebarMeta;
  introCard: LessonIntroCard;
  finish: FinishScreenContent;
  defaultThemeId?: string;
  themeOptions?: ThemeOption[];
  defaultImageId?: string;
  imageOptions?: ImageOption[];
  previewTitle?: (state: {
    selectedThemeId: string;
    selectedImageId: string;
  }) => string;
  previewSandbox?: string;
  buildPreviewDocument: (state: {
    code: string;
    selectedThemeId: string;
    selectedImageId: string;
  }) => string;
  transformStepCode?: (state: {
    code: string;
    step: LessonStep;
    surface: "editor" | "preview";
  }) => string;
  getEditorCodeSlice?: (state: {
    code: string;
    step: LessonStep;
    editorTabId: string;
  }) => string;
  applyEditorCodeSlice?: (state: {
    currentCode: string;
    nextSliceCode: string;
    step: LessonStep;
    editorTabId: string;
  }) => string;
  onSelectImage?: (currentCode: string, image: ImageOption) => string;
  onboardingTour?: LessonOnboardingTourConfig;
};
