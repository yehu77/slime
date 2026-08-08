export type JourneyLayer = "raw" | "derived" | "system";

export type TimelineMode = "sync" | "async";

export type AssessmentQuestionView = {
  id: string;
  type: string;
  prompt: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  correctOrder?: string[];
  answerSummary: string;
  feedback: string;
  returnTo: number;
};

export type AnswerMap = Record<string, string[]>;

export type PersistedJourneyProgress = {
  schemaVersion: 1;
  lessonId: string;
  lessonVersion: string;
  assessmentVersion: string;
  fixtureId: string;
  status: "not_started" | "in_progress" | "completed" | "review_required";
  visitedActs: number[];
  lastEventId: string;
  selectedSampleId: string;
  timelineMode: TimelineMode;
  answers: AnswerMap;
  bestScore: number;
  lastScore: number | null;
  requiredQuestionsPassed: boolean;
  updatedAt: string;
};

export type AssessmentResult = {
  score: number;
  total: number;
  correctIds: string[];
  requiredPassed: boolean;
  completed: boolean;
};
