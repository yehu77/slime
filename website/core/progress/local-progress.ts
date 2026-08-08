import { z } from "zod";

export const LOCAL_PROGRESS_STORAGE_KEY = "slime-lab:progress:v1";
export const LOCAL_PROGRESS_SCHEMA_VERSION = 1 as const;

const LessonProgressSchema = z
  .object({
    lesson_revision: z.number().int().positive(),
    visited_acts: z.array(z.number().int().min(1).max(7)),
    assessment_version: z.number().int().positive().nullable(),
    correct_question_ids: z.array(z.string().min(1)),
    last_event_id: z.string().min(1).nullable(),
    completed: z.boolean(),
    review_required: z.boolean(),
  })
  .strict();

export const LocalProgressSchema = z
  .object({
    schema_version: z.literal(LOCAL_PROGRESS_SCHEMA_VERSION),
    lessons: z.record(z.string().min(1), LessonProgressSchema),
  })
  .strict();

export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type LocalProgress = z.infer<typeof LocalProgressSchema>;

export type CompletionRequirements = {
  min_correct: number;
  required_question_ids: readonly string[];
  required_acts: readonly number[];
};

export type CompletionEvaluation = {
  completed: boolean;
  review_required: boolean;
  correct_count: number;
  missing_question_ids: string[];
  missing_acts: number[];
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createEmptyLocalProgress(): LocalProgress {
  return { schema_version: LOCAL_PROGRESS_SCHEMA_VERSION, lessons: {} };
}

export function createEmptyLessonProgress(lessonRevision = 1): LessonProgress {
  return {
    lesson_revision: lessonRevision,
    visited_acts: [],
    assessment_version: null,
    correct_question_ids: [],
    last_event_id: null,
    completed: false,
    review_required: false,
  };
}

export function evaluateLessonCompletion(
  progress: LessonProgress,
  requirements: CompletionRequirements,
): CompletionEvaluation {
  const correctQuestionIds = new Set(progress.correct_question_ids);
  const visitedActs = new Set(progress.visited_acts);
  const missingQuestionIds = requirements.required_question_ids.filter(
    (questionId) => !correctQuestionIds.has(questionId),
  );
  const missingActs = requirements.required_acts.filter(
    (act) => !visitedActs.has(act),
  );
  const completed =
    correctQuestionIds.size >= requirements.min_correct &&
    missingQuestionIds.length === 0 &&
    missingActs.length === 0;

  return {
    completed,
    review_required:
      progress.correct_question_ids.length > 0 && !completed,
    correct_count: correctQuestionIds.size,
    missing_question_ids: missingQuestionIds,
    missing_acts: missingActs,
  };
}

export function updateLessonProgress(
  localProgress: LocalProgress,
  lessonId: string,
  patch: Partial<
    Pick<
      LessonProgress,
      | "lesson_revision"
      | "visited_acts"
      | "assessment_version"
      | "correct_question_ids"
      | "last_event_id"
    >
  >,
  requirements: CompletionRequirements,
): LocalProgress {
  const current =
    localProgress.lessons[lessonId] ?? createEmptyLessonProgress();
  const candidate = LessonProgressSchema.parse({
    ...current,
    ...patch,
    visited_acts: [...new Set(patch.visited_acts ?? current.visited_acts)].sort(
      (left, right) => left - right,
    ),
    correct_question_ids: [
      ...new Set(
        patch.correct_question_ids ?? current.correct_question_ids,
      ),
    ].sort(),
  });
  const evaluation = evaluateLessonCompletion(candidate, requirements);

  return LocalProgressSchema.parse({
    ...localProgress,
    lessons: {
      ...localProgress.lessons,
      [lessonId]: {
        ...candidate,
        completed: evaluation.completed,
        review_required: evaluation.review_required,
      },
    },
  });
}

export function loadLocalProgress(storage?: StorageLike | null): LocalProgress {
  if (!storage) {
    return createEmptyLocalProgress();
  }
  const serialized = storage.getItem(LOCAL_PROGRESS_STORAGE_KEY);
  if (!serialized) {
    return createEmptyLocalProgress();
  }

  try {
    const parsed = LocalProgressSchema.safeParse(JSON.parse(serialized));
    return parsed.success ? parsed.data : createEmptyLocalProgress();
  } catch {
    return createEmptyLocalProgress();
  }
}

export function saveLocalProgress(
  storage: StorageLike,
  progress: LocalProgress,
): void {
  const validated = LocalProgressSchema.parse(progress);
  storage.setItem(LOCAL_PROGRESS_STORAGE_KEY, JSON.stringify(validated));
}

export function clearLocalProgress(storage: StorageLike): void {
  storage.removeItem(LOCAL_PROGRESS_STORAGE_KEY);
}
