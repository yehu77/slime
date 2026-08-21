export type ContentTruthKind =
  | "source-fact"
  | "teaching-fixture"
  | "advanced-preview";

export interface ContentBlock {
  id: string;
  kind: ContentTruthKind;
  title?: string;
  body: string;
}

export interface SourceReturnLink {
  label: string;
  href: string;
  actId?: string;
}

export interface LessonMicroCheck {
  prompt: string;
  answer: string;
  feedback: string;
}

export interface LessonPrediction {
  prompt: string;
  options: Array<{
    id: string;
    label: string;
  }>;
  correctOptionId: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface LessonActWalkthroughStep {
  label: string;
  title: string;
  body: string;
  facts: string[];
}

export interface LessonActWalkthrough {
  kicker: string;
  title: string;
  introduction: string;
  steps: LessonActWalkthroughStep[];
  caption: string;
}

export interface LessonAct {
  id: string;
  number: number;
  slug: string;
  title: string;
  shortTitle: string;
  durationMinutes: number;
  drivingQuestion: string;
  stage: {
    actor: string;
    visual: string;
  };
  prediction: LessonPrediction;
  narrative?: {
    kicker: string;
    title: string;
    paragraphs: string[];
    directAnswer: string;
    evidenceLead: string;
    takeaway: string;
  };
  walkthrough?: LessonActWalkthrough;
  fieldChanges: string[];
  explanation: ContentBlock[];
  sourceRefIds: string[];
  glossaryTermIds: string[];
  misconception: {
    belief: string;
    correction: string;
  };
  microCheck: LessonMicroCheck;
  transition: string;
}

export interface OverviewStep {
  id: string;
  order: number;
  actor: string;
  action: string;
  passesTo: string;
  durationSeconds: number;
  kind: ContentTruthKind;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export type QuestionType = "single" | "multiple" | "ordering";

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: ChoiceOption[];
  correctOptionIds?: string[];
  correctOrder?: string[];
  required: boolean;
  answerSummary: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
  returnTo: SourceReturnLink;
}

export interface PrerequisiteQuestion {
  id: string;
  concept: string;
  prompt: string;
  options: ChoiceOption[];
  correctOptionId: string;
  feedback: {
    ready: string;
    review: string;
  };
  reviewLink: SourceReturnLink;
}

export interface GlossaryTerm {
  id: string;
  zhLabel: string;
  codeLabel: string;
  definition: string;
  aliases: string[];
  avoid: string[];
  disambiguation: string;
  sourceRefIds: string[];
  usedBy: string[];
}

export interface LearningIntent {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  availability: "m1-ready" | "roadmap-preview";
  recommendation: string;
}
