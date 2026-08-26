import { z } from "zod";

export const LOCAL_PROGRESS_V2_STORAGE_KEY = "slime-lab:progress:v2";
export const LOCAL_PROGRESS_V1_STORAGE_KEY = "slime-lab:progress:v1";
export const LOCAL_PROGRESS_V2_SCHEMA_VERSION = 2 as const;

const StableIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/);
const TimestampSchema = z.iso.datetime();

function uniqueIds(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

const ChoiceExerciseResponseSchema = z
  .object({
    type: z.literal("choice"),
    selected_option_ids: z.array(StableIdSchema).min(1).refine(uniqueIds),
  })
  .strict();

const OrderingExerciseResponseSchema = z
  .object({
    type: z.literal("ordering"),
    ordered_item_ids: z.array(StableIdSchema).min(1).refine(uniqueIds),
  })
  .strict();

const MappingExerciseResponseSchema = z
  .object({
    type: z.literal("mapping"),
    assignments: z.record(StableIdSchema, StableIdSchema),
  })
  .strict();

const FieldEntryExerciseResponseSchema = z
  .object({
    type: z.literal("field-entry"),
    values: z.record(StableIdSchema, z.string()),
  })
  .strict();

export const StructuredExerciseResponseSchema = z.discriminatedUnion("type", [
  ChoiceExerciseResponseSchema,
  OrderingExerciseResponseSchema,
  MappingExerciseResponseSchema,
  FieldEntryExerciseResponseSchema,
]);

export const LessonResumeSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("sample-journey"),
      event_id: StableIdSchema,
      selected_sample_id: StableIdSchema,
      timeline_mode: z.enum(["sync", "async"]),
      fixture_id: StableIdSchema.nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("chaptered"),
      chapter_id: StableIdSchema,
      section_id: StableIdSchema.nullable(),
    })
    .strict(),
]);

export const ExerciseAttemptV2Schema = z
  .object({
    last_response: StructuredExerciseResponseSchema,
    attempt_count: z.number().int().positive(),
    passed: z.boolean(),
    last_attempt_at: TimestampSchema,
    passed_at: TimestampSchema.nullable(),
  })
  .strict()
  .refine((attempt) => !attempt.passed || attempt.passed_at !== null, {
    message: "A passed exercise attempt must record passed_at",
  });

export const LearningArtifactV2Schema = z
  .object({
    status: z.enum(["submitted", "skipped"]),
    response: StructuredExerciseResponseSchema.nullable(),
    submitted_at: TimestampSchema,
  })
  .strict();

export const FinalAssessmentProgressV2Schema = z
  .object({
    assessment_version: z.number().int().positive(),
    attempt_count: z.number().int().positive(),
    last_correct_question_ids: z
      .array(StableIdSchema)
      .refine(uniqueIds),
    last_score: z.number().int().nonnegative(),
    best_score: z.number().int().nonnegative(),
    last_required_question_ids_passed: z.boolean(),
    passed: z.boolean(),
    last_attempt_at: TimestampSchema,
    passed_at: TimestampSchema.nullable(),
  })
  .strict()
  .refine((assessment) => assessment.best_score >= assessment.last_score, {
    message: "best_score cannot be lower than last_score",
  })
  .refine((assessment) => !assessment.passed || assessment.passed_at !== null, {
    message: "A passed assessment must record passed_at",
  });

export const LessonProgressV2Schema = z
  .object({
    lesson_revision: z.number().int().positive(),
    visited_sections: z.array(StableIdSchema).refine(uniqueIds),
    exercise_attempts: z.record(StableIdSchema, ExerciseAttemptV2Schema),
    final_assessment: FinalAssessmentProgressV2Schema.nullable(),
    learning_artifacts: z
      .record(StableIdSchema, LearningArtifactV2Schema)
      .optional(),
    resume: LessonResumeSchema.nullable(),
    updated_at: TimestampSchema,
  })
  .strict();

export const LocalProgressV2Schema = z
  .object({
    schema_version: z.literal(LOCAL_PROGRESS_V2_SCHEMA_VERSION),
    lessons: z.record(StableIdSchema, LessonProgressV2Schema),
  })
  .strict();

const FinalAssessmentRequirementsSchema = z
  .object({
    assessment_version: z.number().int().positive(),
    question_ids: z.array(StableIdSchema).min(1).refine(uniqueIds),
    min_correct: z.number().int().nonnegative(),
    required_question_ids: z.array(StableIdSchema).refine(uniqueIds),
  })
  .strict()
  .superRefine((assessment, context) => {
    const questionIds = new Set(assessment.question_ids);
    if (assessment.min_correct > assessment.question_ids.length) {
      context.addIssue({
        code: "custom",
        message: "min_correct cannot exceed the number of questions",
        path: ["min_correct"],
      });
    }
    for (const questionId of assessment.required_question_ids) {
      if (!questionIds.has(questionId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown required question: ${questionId}`,
          path: ["required_question_ids"],
        });
      }
    }
  });

export const ProgressCompletionManifestSchema = z
  .object({
    lesson_revision: z.number().int().positive(),
    completion: z
      .object({
        required_section_ids: z.array(StableIdSchema).refine(uniqueIds),
        required_exercise_ids: z.array(StableIdSchema).refine(uniqueIds),
        final_assessment: FinalAssessmentRequirementsSchema,
      })
      .strict(),
  })
  .strict();

export const ProgressEventSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("revision-started"),
    })
    .strict(),
  z
    .object({
      type: z.literal("section-visited"),
      section_id: StableIdSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("exercise-submitted"),
      exercise_id: StableIdSchema,
      response: StructuredExerciseResponseSchema,
      passed: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("assessment-submitted"),
      correct_question_ids: z
        .array(StableIdSchema)
        .refine(uniqueIds),
    })
    .strict(),
  z
    .object({
      type: z.literal("resume-updated"),
      resume: LessonResumeSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("learning-artifact-recorded"),
      artifact_id: StableIdSchema,
      status: z.enum(["submitted", "skipped"]),
      response: StructuredExerciseResponseSchema.nullable(),
    })
    .strict(),
]);

export type StructuredExerciseResponse = z.infer<
  typeof StructuredExerciseResponseSchema
>;
export type LessonResume = z.infer<typeof LessonResumeSchema>;
export type ExerciseAttemptV2 = z.infer<typeof ExerciseAttemptV2Schema>;
export type FinalAssessmentProgressV2 = z.infer<
  typeof FinalAssessmentProgressV2Schema
>;
export type LearningArtifactV2 = z.infer<typeof LearningArtifactV2Schema>;
export type LessonProgressV2 = z.infer<typeof LessonProgressV2Schema>;
export type LocalProgressV2 = z.infer<typeof LocalProgressV2Schema>;
export type ProgressCompletionManifest = z.infer<
  typeof ProgressCompletionManifestSchema
>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
export type LessonProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "review_required";
export type Now = () => string;
export type ProgressStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type LessonProgressEvaluation = {
  status: LessonProgressStatus;
  completed: boolean;
  missing_section_ids: string[];
  missing_exercise_ids: string[];
  assessment_passed: boolean;
};

const LegacySnakeLessonSchema = z
  .object({
    lesson_revision: z.number().int().positive(),
    visited_acts: z.array(z.number().int().min(1).max(7)),
    assessment_version: z.number().int().positive().nullable(),
    correct_question_ids: z.array(StableIdSchema),
    last_event_id: StableIdSchema.nullable(),
    completed: z.boolean(),
    review_required: z.boolean(),
  })
  .strict();

const LegacySnakeProgressSchema = z
  .object({
    schema_version: z.literal(1),
    lessons: z.record(StableIdSchema, LegacySnakeLessonSchema),
  })
  .strict();

const LegacyAnswerMapSchema = z.record(
  StableIdSchema,
  z.array(z.string()),
);

const LegacyCamelProgressSchema = z
  .object({
    schemaVersion: z.literal(1),
    lessonId: StableIdSchema,
    lessonVersion: z.string(),
    assessmentVersion: z.string(),
    fixtureId: z.string(),
    status: z.enum([
      "not_started",
      "in_progress",
      "completed",
      "review_required",
    ]),
    visitedActs: z.array(z.number().int().min(1).max(7)),
    lastEventId: StableIdSchema,
    selectedSampleId: StableIdSchema,
    timelineMode: z.enum(["sync", "async"]),
    answers: LegacyAnswerMapSchema,
    bestScore: z.number().int().nonnegative(),
    lastScore: z.number().int().nonnegative().nullable(),
    requiredQuestionsPassed: z.boolean(),
    updatedAt: z.string(),
  })
  .strict();

function systemNow(): string {
  return new Date().toISOString();
}

function readNow(now: Now): string {
  return TimestampSchema.parse(now());
}

function parsePositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function createLessonProgressV2(
  lessonRevision: number,
  updatedAt: string,
): LessonProgressV2 {
  return {
    lesson_revision: lessonRevision,
    visited_sections: [],
    exercise_attempts: {},
    final_assessment: null,
    learning_artifacts: {},
    resume: null,
    updated_at: updatedAt,
  };
}

function hasActivity(progress: LessonProgressV2): boolean {
  return (
    progress.visited_sections.length > 0 ||
    Object.keys(progress.exercise_attempts).length > 0 ||
    progress.final_assessment !== null ||
    Object.keys(progress.learning_artifacts ?? {}).length > 0 ||
    progress.resume !== null
  );
}

function migrateSnakeProgress(
  legacy: z.infer<typeof LegacySnakeProgressSchema>,
  updatedAt: string,
): LocalProgressV2 {
  return LocalProgressV2Schema.parse({
    schema_version: LOCAL_PROGRESS_V2_SCHEMA_VERSION,
    lessons: Object.fromEntries(
      Object.entries(legacy.lessons).map(([lessonId, lesson]) => {
        const hasAssessment = lesson.assessment_version !== null;
        return [
          lessonId,
          {
            lesson_revision: lesson.lesson_revision,
            visited_sections: [
              ...new Set(lesson.visited_acts.map((act) => `act-${act}`)),
            ],
            exercise_attempts: {},
            final_assessment: hasAssessment
              ? {
                  assessment_version: lesson.assessment_version,
                  attempt_count: 1,
                  last_correct_question_ids: [
                    ...new Set(lesson.correct_question_ids),
                  ],
                  last_score: new Set(lesson.correct_question_ids).size,
                  best_score: new Set(lesson.correct_question_ids).size,
                  last_required_question_ids_passed: lesson.completed,
                  passed: lesson.completed,
                  last_attempt_at: updatedAt,
                  passed_at: lesson.completed ? updatedAt : null,
                }
              : null,
            learning_artifacts: {},
            resume: lesson.last_event_id
              ? {
                  kind: "sample-journey" as const,
                  event_id: lesson.last_event_id,
                  selected_sample_id: "a0",
                  timeline_mode: "sync" as const,
                  fixture_id: null,
                }
              : null,
            updated_at: updatedAt,
          },
        ];
      }),
    ),
  });
}

function migrateCamelProgress(
  legacy: z.infer<typeof LegacyCamelProgressSchema>,
  fallbackUpdatedAt: string,
): LocalProgressV2 | null {
  const lessonRevision = parsePositiveInteger(legacy.lessonVersion);
  const assessmentVersion = parsePositiveInteger(legacy.assessmentVersion);
  if (!lessonRevision) return null;

  const storedTimestamp = TimestampSchema.safeParse(legacy.updatedAt);
  const updatedAt = storedTimestamp.success
    ? storedTimestamp.data
    : fallbackUpdatedAt;
  const hasAssessment =
    assessmentVersion !== null &&
    (legacy.lastScore !== null ||
      legacy.bestScore > 0 ||
      legacy.status === "completed" ||
      Object.keys(legacy.answers).length > 0);
  const lastScore = legacy.lastScore ?? legacy.bestScore;
  const exerciseAttempts = Object.fromEntries(
    Object.entries(legacy.answers).flatMap(([questionId, selectedOptionIds]) => {
      const response = StructuredExerciseResponseSchema.safeParse({
        type: "choice",
        selected_option_ids: selectedOptionIds,
      });
      return response.success
        ? [
            [
              questionId,
              {
                last_response: response.data,
                attempt_count: 1,
                passed: false,
                last_attempt_at: updatedAt,
                passed_at: null,
              },
            ] as const,
          ]
        : [];
    }),
  );

  return LocalProgressV2Schema.parse({
    schema_version: LOCAL_PROGRESS_V2_SCHEMA_VERSION,
    lessons: {
      [legacy.lessonId]: {
        lesson_revision: lessonRevision,
        visited_sections: [
          ...new Set(legacy.visitedActs.map((act) => `act-${act}`)),
        ],
        exercise_attempts: exerciseAttempts,
        final_assessment: hasAssessment
          ? {
              assessment_version: assessmentVersion,
              attempt_count: 1,
              last_correct_question_ids: [],
              last_score: lastScore,
              best_score: Math.max(legacy.bestScore, lastScore),
              last_required_question_ids_passed:
                legacy.requiredQuestionsPassed,
              passed: legacy.status === "completed",
              last_attempt_at: updatedAt,
              passed_at: legacy.status === "completed" ? updatedAt : null,
            }
          : null,
        learning_artifacts: {},
        resume: {
          kind: "sample-journey" as const,
          event_id: legacy.lastEventId,
          selected_sample_id: legacy.selectedSampleId,
          timeline_mode: legacy.timelineMode,
          fixture_id: legacy.fixtureId || null,
        },
        updated_at: updatedAt,
      },
    },
  });
}

export function createEmptyLocalProgressV2(): LocalProgressV2 {
  return { schema_version: LOCAL_PROGRESS_V2_SCHEMA_VERSION, lessons: {} };
}

export function evaluateLessonProgressV2(
  progress: LessonProgressV2 | undefined,
  manifestInput: ProgressCompletionManifest,
): LessonProgressEvaluation {
  const manifest = ProgressCompletionManifestSchema.parse(manifestInput);
  const validatedProgress = progress
    ? LessonProgressV2Schema.parse(progress)
    : undefined;
  if (!validatedProgress || !hasActivity(validatedProgress)) {
    return {
      status: "not_started",
      completed: false,
      missing_section_ids: [...manifest.completion.required_section_ids],
      missing_exercise_ids: [...manifest.completion.required_exercise_ids],
      assessment_passed: false,
    };
  }

  const visitedSections = new Set(validatedProgress.visited_sections);
  const missingSectionIds = manifest.completion.required_section_ids.filter(
    (sectionId) => !visitedSections.has(sectionId),
  );
  const missingExerciseIds = manifest.completion.required_exercise_ids.filter(
    (exerciseId) => !validatedProgress.exercise_attempts[exerciseId]?.passed,
  );
  const assessment = validatedProgress.final_assessment;
  const versionsMatch =
    validatedProgress.lesson_revision === manifest.lesson_revision &&
    (assessment === null ||
      assessment.assessment_version ===
        manifest.completion.final_assessment.assessment_version);

  if (!versionsMatch) {
    return {
      status: "review_required",
      completed: false,
      missing_section_ids: missingSectionIds,
      missing_exercise_ids: missingExerciseIds,
      assessment_passed: false,
    };
  }

  const assessmentPassed = Boolean(assessment?.passed);
  const completed =
    missingSectionIds.length === 0 &&
    missingExerciseIds.length === 0 &&
    assessmentPassed;
  return {
    status: completed ? "completed" : "in_progress",
    completed,
    missing_section_ids: missingSectionIds,
    missing_exercise_ids: missingExerciseIds,
    assessment_passed: assessmentPassed,
  };
}

export function applyLessonProgressEvent(
  localProgressInput: LocalProgressV2,
  lessonId: string,
  manifestInput: ProgressCompletionManifest,
  eventInput: ProgressEvent,
  now: Now = systemNow,
): LocalProgressV2 {
  const localProgress = LocalProgressV2Schema.parse(localProgressInput);
  const parsedLessonId = StableIdSchema.parse(lessonId);
  const manifest = ProgressCompletionManifestSchema.parse(manifestInput);
  const event = ProgressEventSchema.parse(eventInput);

  if (
    event.type === "exercise-submitted" &&
    !manifest.completion.required_exercise_ids.includes(event.exercise_id)
  ) {
    return localProgressInput;
  }

  const updatedAt = readNow(now);
  const stored = localProgress.lessons[parsedLessonId];
  const revisionMatches = stored?.lesson_revision === manifest.lesson_revision;

  if (
    stored &&
    !revisionMatches &&
    (event.type === "section-visited" || event.type === "resume-updated")
  ) {
    return localProgressInput;
  }
  const current =
    revisionMatches
      ? stored
      : createLessonProgressV2(manifest.lesson_revision, updatedAt);
  let next: LessonProgressV2;

  if (event.type === "revision-started") {
    next = current;
  } else if (event.type === "section-visited") {
    next = {
      ...current,
      visited_sections: current.visited_sections.includes(event.section_id)
        ? current.visited_sections
        : [...current.visited_sections, event.section_id],
      updated_at: updatedAt,
    };
  } else if (event.type === "resume-updated") {
    next = { ...current, resume: event.resume, updated_at: updatedAt };
  } else if (event.type === "learning-artifact-recorded") {
    const previous = current.learning_artifacts?.[event.artifact_id];
    if (previous?.status === "submitted") return localProgressInput;
    if (previous?.status === "skipped" && event.status === "skipped") {
      return localProgressInput;
    }
    next = {
      ...current,
      learning_artifacts: {
        ...current.learning_artifacts,
        [event.artifact_id]: {
          status: event.status,
          response: event.status === "submitted" ? event.response : null,
          submitted_at: updatedAt,
        },
      },
      updated_at: updatedAt,
    };
  } else if (event.type === "exercise-submitted") {
    const previous = current.exercise_attempts[event.exercise_id];
    const passed = Boolean(previous?.passed || event.passed);
    next = {
      ...current,
      exercise_attempts: {
        ...current.exercise_attempts,
        [event.exercise_id]: {
          last_response: event.response,
          attempt_count: (previous?.attempt_count ?? 0) + 1,
          passed,
          last_attempt_at: updatedAt,
          passed_at: previous?.passed_at ?? (event.passed ? updatedAt : null),
        },
      },
      updated_at: updatedAt,
    };
  } else {
    const requirements = manifest.completion.final_assessment;
    const unknownQuestionId = event.correct_question_ids.find(
      (questionId) => !requirements.question_ids.includes(questionId),
    );
    if (unknownQuestionId) {
      throw new Error(`Unknown assessment question: ${unknownQuestionId}`);
    }
    const previous =
      current.final_assessment?.assessment_version ===
      requirements.assessment_version
        ? current.final_assessment
        : null;
    const correctIds = new Set(event.correct_question_ids);
    const requiredPassed = requirements.required_question_ids.every(
      (questionId) => correctIds.has(questionId),
    );
    const passedThisAttempt =
      correctIds.size >= requirements.min_correct && requiredPassed;
    const passed = Boolean(previous?.passed || passedThisAttempt);
    next = {
      ...current,
      final_assessment: {
        assessment_version: requirements.assessment_version,
        attempt_count: (previous?.attempt_count ?? 0) + 1,
        last_correct_question_ids: event.correct_question_ids,
        last_score: correctIds.size,
        best_score: Math.max(previous?.best_score ?? 0, correctIds.size),
        last_required_question_ids_passed: requiredPassed,
        passed,
        last_attempt_at: updatedAt,
        passed_at:
          previous?.passed_at ?? (passedThisAttempt ? updatedAt : null),
      },
      updated_at: updatedAt,
    };
  }

  return LocalProgressV2Schema.parse({
    ...localProgress,
    lessons: {
      ...localProgress.lessons,
      [parsedLessonId]: next,
    },
  });
}

export function loadLocalProgressV2(
  storage?: ProgressStorage | null,
  now: Now = systemNow,
): LocalProgressV2 {
  if (!storage) return createEmptyLocalProgressV2();

  let serializedV2: string | null;
  try {
    serializedV2 = storage.getItem(LOCAL_PROGRESS_V2_STORAGE_KEY);
  } catch {
    return createEmptyLocalProgressV2();
  }

  if (serializedV2 !== null) {
    try {
      const parsed = LocalProgressV2Schema.safeParse(JSON.parse(serializedV2));
      if (!parsed.success) return createEmptyLocalProgressV2();
      return LocalProgressV2Schema.parse({
        ...parsed.data,
        lessons: Object.fromEntries(
          Object.entries(parsed.data.lessons).map(([lessonId, lesson]) => [
            lessonId,
            { ...lesson, learning_artifacts: lesson.learning_artifacts ?? {} },
          ]),
        ),
      });
    } catch {
      return createEmptyLocalProgressV2();
    }
  }

  let serializedV1: string | null;
  try {
    serializedV1 = storage.getItem(LOCAL_PROGRESS_V1_STORAGE_KEY);
  } catch {
    return createEmptyLocalProgressV2();
  }
  if (serializedV1 === null) return createEmptyLocalProgressV2();

  try {
    const raw: unknown = JSON.parse(serializedV1);
    const updatedAt = readNow(now);
    const snake = LegacySnakeProgressSchema.safeParse(raw);
    const migrated = snake.success
      ? migrateSnakeProgress(snake.data, updatedAt)
      : (() => {
          const camel = LegacyCamelProgressSchema.safeParse(raw);
          return camel.success
            ? migrateCamelProgress(camel.data, updatedAt)
            : null;
        })();
    if (!migrated) return createEmptyLocalProgressV2();

    try {
      storage.setItem(
        LOCAL_PROGRESS_V2_STORAGE_KEY,
        JSON.stringify(migrated),
      );
    } catch {
      // A storage quota failure should not discard an otherwise valid migration.
    }
    return migrated;
  } catch {
    return createEmptyLocalProgressV2();
  }
}

export function saveLocalProgressV2(
  storage: ProgressStorage,
  progress: LocalProgressV2,
): void {
  const validated = LocalProgressV2Schema.parse(progress);
  storage.setItem(
    LOCAL_PROGRESS_V2_STORAGE_KEY,
    JSON.stringify(validated),
  );
}

export function clearLessonProgressV2(
  storage: ProgressStorage,
  lessonId: string,
  now: Now = systemNow,
): LocalProgressV2 {
  const parsedLessonId = StableIdSchema.parse(lessonId);
  const current = loadLocalProgressV2(storage, now);
  const lessons = { ...current.lessons };
  delete lessons[parsedLessonId];
  const next = LocalProgressV2Schema.parse({ ...current, lessons });
  saveLocalProgressV2(storage, next);
  return next;
}
