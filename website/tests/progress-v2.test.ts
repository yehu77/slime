import { describe, expect, it, vi } from "vitest";

import { sampleToGenerationProgressManifest } from "@/content/zh/course-progress-manifests";

import {
  LOCAL_PROGRESS_V1_STORAGE_KEY,
  LOCAL_PROGRESS_V2_STORAGE_KEY,
  LocalProgressV2Schema,
  StructuredExerciseResponseSchema,
  applyLessonProgressEvent,
  clearLessonProgressV2,
  createEmptyLocalProgressV2,
  discardOutdatedLessonProgressV2,
  evaluateLessonProgressV2,
  isLessonProgressCurrentV2,
  loadLocalProgressV2,
  reconcileStoredProgressV2,
  saveLocalProgressV2,
  type ProgressCompletionManifest,
  type ProgressStorage,
} from "@/core/progress";

const NOW = "2026-08-20T12:00:00.000Z";
const LATER = "2026-08-20T13:00:00.000Z";
const LATEST = "2026-08-20T14:00:00.000Z";
const now = () => NOW;

const manifest: ProgressCompletionManifest = {
  lesson_revision: 3,
  completion: {
    required_section_ids: ["chapter-1", "chapter-2"],
    required_exercise_ids: ["exercise-1", "exercise-2"],
    final_assessment: {
      assessment_version: 2,
      question_ids: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
      min_correct: 7,
      required_question_ids: ["q2", "q4", "q6", "q8"],
    },
  },
};

function createStorage(
  initial: Record<string, string> = {},
): { storage: ProgressStorage; values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: (key) => void values.delete(key),
    },
  };
}

function completeCourse() {
  let progress = createEmptyLocalProgressV2();
  for (const sectionId of manifest.completion.required_section_ids) {
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      manifest,
      { type: "section-visited", section_id: sectionId },
      now,
    );
  }
  for (const exerciseId of manifest.completion.required_exercise_ids) {
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      manifest,
      {
        type: "exercise-submitted",
        exercise_id: exerciseId,
        response: { type: "choice", selected_option_ids: ["option-a"] },
        passed: true,
      },
      now,
    );
  }
  return applyLessonProgressEvent(
    progress,
    "core.sample-to-generation",
    manifest,
    {
      type: "assessment-submitted",
      correct_question_ids: ["q1", "q2", "q3", "q4", "q5", "q6", "q8"],
    },
    now,
  );
}

describe("progress v2 schemas", () => {
  it("accepts all four structured response types and rejects extra fields", () => {
    expect(
      StructuredExerciseResponseSchema.parse({
        type: "choice",
        selected_option_ids: ["sample"],
      }),
    ).toEqual({ type: "choice", selected_option_ids: ["sample"] });
    expect(
      StructuredExerciseResponseSchema.parse({
        type: "ordering",
        ordered_item_ids: ["row", "sample", "request"],
      }),
    ).toMatchObject({ type: "ordering" });
    expect(
      StructuredExerciseResponseSchema.parse({
        type: "mapping",
        assignments: { prompt: "semantic-input", index: "identity" },
      }),
    ).toMatchObject({ type: "mapping" });
    expect(
      StructuredExerciseResponseSchema.parse({
        type: "field-entry",
        values: { group_index: "0", index: "2" },
      }),
    ).toMatchObject({ type: "field-entry" });
    expect(() =>
      StructuredExerciseResponseSchema.parse({
        type: "choice",
        selected_option_ids: ["sample"],
        answer: "sample",
      }),
    ).toThrow();
  });

  it("uses a strict discriminated resume shape", () => {
    let progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      manifest,
      {
        type: "resume-updated",
        resume: {
          kind: "chaptered",
          chapter_id: "grouping",
          section_id: "identity-table",
        },
      },
      now,
    );
    expect(progress.lessons["core.sample-to-generation"]?.resume).toMatchObject({
      kind: "chaptered",
      chapter_id: "grouping",
    });

    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      manifest,
      {
        type: "resume-updated",
        resume: {
          kind: "sample-journey",
          event_id: "group-built",
          selected_sample_id: "a0",
          timeline_mode: "sync",
          fixture_id: "math-2x2-v1",
        },
      },
      now,
    );
    expect(LocalProgressV2Schema.parse(progress)).toEqual(progress);
  });

  it("keeps the first submitted learning artifact immutable and lets a skip become one submission", () => {
    const skipped = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      manifest,
      {
        type: "learning-artifact-recorded",
        artifact_id: "chapter-1-transfer",
        status: "skipped",
        response: null,
      },
      now,
    );
    expect(skipped.lessons["core.sample-to-generation"]?.learning_artifacts).toEqual({
      "chapter-1-transfer": {
        status: "skipped",
        response: null,
        submitted_at: NOW,
      },
    });

    const submitted = applyLessonProgressEvent(
      skipped,
      "core.sample-to-generation",
      manifest,
      {
        type: "learning-artifact-recorded",
        artifact_id: "chapter-1-transfer",
        status: "submitted",
        response: { type: "choice", selected_option_ids: ["option-a"] },
      },
      () => LATER,
    );
    const retried = applyLessonProgressEvent(
      submitted,
      "core.sample-to-generation",
      manifest,
      {
        type: "learning-artifact-recorded",
        artifact_id: "chapter-1-transfer",
        status: "submitted",
        response: { type: "choice", selected_option_ids: ["option-b"] },
      },
      () => LATEST,
    );
    expect(retried.lessons["core.sample-to-generation"]?.learning_artifacts?.["chapter-1-transfer"]).toEqual({
      status: "submitted",
      response: { type: "choice", selected_option_ids: ["option-a"] },
      submitted_at: LATER,
    });
  });
});

describe("progress v2 completion", () => {
  it("treats records from another revision as not started", () => {
    expect(evaluateLessonProgressV2(undefined, manifest).status).toBe(
      "not_started",
    );
    const started = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      manifest,
      { type: "section-visited", section_id: "chapter-1" },
      now,
    );
    expect(
      evaluateLessonProgressV2(
        started.lessons["core.sample-to-generation"],
        manifest,
      ).status,
    ).toBe("in_progress");

    const completed = completeCourse();
    expect(
      evaluateLessonProgressV2(
        completed.lessons["core.sample-to-generation"],
        manifest,
      ),
    ).toMatchObject({ status: "completed", completed: true });

    expect(
      evaluateLessonProgressV2(
        completed.lessons["core.sample-to-generation"],
        { ...manifest, lesson_revision: 4 },
      ).status,
    ).toBe("not_started");
    expect(
      evaluateLessonProgressV2(
        completed.lessons["core.sample-to-generation"],
        {
          ...manifest,
          completion: {
            ...manifest.completion,
            final_assessment: {
              ...manifest.completion.final_assessment,
              assessment_version: 3,
            },
          },
        },
      ).status,
    ).toBe("not_started");
  });

  it("starts the current revision fresh on the first passive navigation event", () => {
    const completed = completeCourse();
    const nextManifest = { ...manifest, lesson_revision: manifest.lesson_revision + 1 };
    const passive = applyLessonProgressEvent(
      completed,
      "core.sample-to-generation",
      nextManifest,
      { type: "section-visited", section_id: "chapter-1" },
      () => LATER,
    );
    expect(passive.lessons["core.sample-to-generation"]).toMatchObject({
      lesson_revision: nextManifest.lesson_revision,
      visited_sections: ["chapter-1"],
      exercise_attempts: {},
      learning_artifacts: {},
      final_assessment: null,
      resume: null,
      updated_at: LATER,
    });
  });

  it("deletes only the outdated lesson and leaves another current lesson intact", () => {
    const generation = completeCourse();
    const mixed = applyLessonProgressEvent(
      generation,
      "core.sample-journey",
      manifest,
      { type: "section-visited", section_id: "chapter-1" },
      now,
    );
    const registry = {
      "core.sample-to-generation": {
        ...manifest,
        lesson_revision: manifest.lesson_revision + 1,
      },
      "core.sample-journey": manifest,
    };

    const cleaned = discardOutdatedLessonProgressV2(mixed, registry);
    expect(cleaned.lessons["core.sample-to-generation"]).toBeUndefined();
    expect(cleaned.lessons["core.sample-journey"]).toMatchObject({
      lesson_revision: manifest.lesson_revision,
      visited_sections: ["chapter-1"],
    });
    expect(discardOutdatedLessonProgressV2(cleaned, registry)).toBe(cleaned);
  });

  it("persists obsolete cleanup once and does not echo a cross-tab storage event", () => {
    const generation = completeCourse();
    const mixed = applyLessonProgressEvent(
      generation,
      "core.sample-journey",
      manifest,
      { type: "section-visited", section_id: "chapter-1" },
      now,
    );
    const registry = {
      "core.sample-to-generation": {
        ...manifest,
        lesson_revision: manifest.lesson_revision + 1,
      },
      "core.sample-journey": manifest,
    };
    const { storage } = createStorage({
      [LOCAL_PROGRESS_V2_STORAGE_KEY]: JSON.stringify(mixed),
    });
    const setItem = vi.spyOn(storage, "setItem");

    const firstHydration = reconcileStoredProgressV2(storage, registry, now);
    expect(firstHydration).toMatchObject({
      changed: true,
      persistence_unavailable: false,
    });
    expect(
      firstHydration.progress.lessons["core.sample-to-generation"],
    ).toBeUndefined();
    expect(firstHydration.progress.lessons["core.sample-journey"]).toBeDefined();
    expect(setItem).toHaveBeenCalledTimes(1);

    const storageEventHydration = reconcileStoredProgressV2(
      storage,
      registry,
      now,
    );
    expect(storageEventHydration).toMatchObject({
      changed: false,
      persistence_unavailable: false,
    });
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("keeps future progress without rewriting it during a rollback", () => {
    const completed = completeCourse();
    const stored = completed.lessons["core.sample-to-generation"]!;
    const futureProgress = {
      ...completed,
      lessons: {
        ...completed.lessons,
        "core.sample-to-generation": {
          ...stored,
          lesson_revision: manifest.lesson_revision + 2,
        },
      },
    };
    const { storage } = createStorage({
      [LOCAL_PROGRESS_V2_STORAGE_KEY]: JSON.stringify(futureProgress),
    });
    const setItem = vi.spyOn(storage, "setItem");

    const reconciliation = reconcileStoredProgressV2(
      storage,
      {
        "core.sample-to-generation": {
          ...manifest,
          lesson_revision: manifest.lesson_revision + 1,
        },
      },
      now,
    );
    const retained =
      reconciliation.progress.lessons["core.sample-to-generation"];
    expect(reconciliation.changed).toBe(false);
    expect(retained?.lesson_revision).toBe(manifest.lesson_revision + 2);
    expect(
      isLessonProgressCurrentV2(retained, {
        ...manifest,
        lesson_revision: manifest.lesson_revision + 1,
      }),
    ).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("uses the cleaned in-memory state when persistence is unavailable", () => {
    const completed = completeCourse();
    const storage: ProgressStorage = {
      getItem: (key) =>
        key === LOCAL_PROGRESS_V2_STORAGE_KEY
          ? JSON.stringify(completed)
          : null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => undefined,
    };
    const reconciliation = reconcileStoredProgressV2(
      storage,
      {
        "core.sample-to-generation": {
          ...manifest,
          lesson_revision: manifest.lesson_revision + 1,
        },
      },
      now,
    );

    expect(reconciliation).toMatchObject({
      changed: true,
      persistence_unavailable: true,
    });
    expect(
      reconciliation.progress.lessons["core.sample-to-generation"],
    ).toBeUndefined();
  });

  it("reports a storage read failure instead of presenting an empty record as persisted", () => {
    const storage: ProgressStorage = {
      getItem: () => {
        throw new Error("storage access denied");
      },
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    const reconciliation = reconcileStoredProgressV2(
      storage,
      { "core.sample-to-generation": manifest },
      now,
    );
    expect(reconciliation).toEqual({
      progress: createEmptyLocalProgressV2(),
      changed: false,
      persistence_unavailable: true,
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("keeps a migrated v1 record in memory and reports its failed v2 write", () => {
    const legacy = JSON.stringify({
      schema_version: 1,
      lessons: {
        "core.sample-journey": {
          lesson_revision: 7,
          visited_acts: [1, 2],
          assessment_version: null,
          correct_question_ids: [],
          last_event_id: "group-built",
          completed: false,
          review_required: false,
        },
      },
    });
    const storage: ProgressStorage = {
      getItem: (key) =>
        key === LOCAL_PROGRESS_V1_STORAGE_KEY ? legacy : null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: vi.fn(),
    };

    const reconciliation = reconcileStoredProgressV2(
      storage,
      {
        "core.sample-journey": {
          ...manifest,
          lesson_revision: 7,
        },
      },
      now,
    );
    expect(reconciliation).toMatchObject({
      changed: false,
      persistence_unavailable: true,
    });
    expect(reconciliation.progress.lessons["core.sample-journey"]).toMatchObject({
      lesson_revision: 7,
      visited_sections: ["act-1", "act-2"],
    });
  });

  it("deletes an outdated assessment but preserves progress from a future deployment", () => {
    const completed = completeCourse();
    const assessmentUpdatedManifest = {
      ...manifest,
      completion: {
        ...manifest.completion,
        final_assessment: {
          ...manifest.completion.final_assessment,
          assessment_version:
            manifest.completion.final_assessment.assessment_version + 1,
        },
      },
    };
    expect(
      discardOutdatedLessonProgressV2(completed, {
        "core.sample-to-generation": assessmentUpdatedManifest,
      }).lessons["core.sample-to-generation"],
    ).toBeUndefined();

    const stored = completed.lessons["core.sample-to-generation"]!;
    const futureProgress = {
      ...completed,
      lessons: {
        ...completed.lessons,
        "core.sample-to-generation": {
          ...stored,
          lesson_revision: manifest.lesson_revision + 2,
        },
      },
    };
    const rollbackManifest = {
      ...manifest,
      lesson_revision: manifest.lesson_revision + 1,
    };
    expect(
      discardOutdatedLessonProgressV2(futureProgress, {
        "core.sample-to-generation": rollbackManifest,
      }),
    ).toBe(futureProgress);
    expect(
      isLessonProgressCurrentV2(
        futureProgress.lessons["core.sample-to-generation"],
        rollbackManifest,
      ),
    ).toBe(false);
    expect(
      applyLessonProgressEvent(
        futureProgress,
        "core.sample-to-generation",
        rollbackManifest,
        { type: "section-visited", section_id: "chapter-1" },
        () => LATER,
      ),
    ).toBe(futureProgress);
    expect(
      evaluateLessonProgressV2(
        futureProgress.lessons["core.sample-to-generation"],
        rollbackManifest,
      ).status,
    ).toBe("not_started");
  });

  it("keeps a pass sticky for later attempts in the same version", () => {
    const completed = completeCourse();
    const retried = applyLessonProgressEvent(
      completed,
      "core.sample-to-generation",
      manifest,
      { type: "assessment-submitted", correct_question_ids: ["q1", "q2"] },
      () => LATER,
    );
    const assessment =
      retried.lessons["core.sample-to-generation"]?.final_assessment;
    expect(assessment).toMatchObject({
      attempt_count: 2,
      last_score: 2,
      best_score: 7,
      passed: true,
      passed_at: NOW,
      last_attempt_at: LATER,
    });
    expect(
      evaluateLessonProgressV2(
        retried.lessons["core.sample-to-generation"],
        manifest,
      ).status,
    ).toBe("completed");

    const exerciseRetried = applyLessonProgressEvent(
      retried,
      "core.sample-to-generation",
      manifest,
      {
        type: "exercise-submitted",
        exercise_id: "exercise-1",
        response: { type: "choice", selected_option_ids: ["option-b"] },
        passed: false,
      },
      () => LATER,
    );
    expect(
      exerciseRetried.lessons["core.sample-to-generation"]?.exercise_attempts[
        "exercise-1"
      ],
    ).toMatchObject({ attempt_count: 2, passed: true, passed_at: NOW });
  });

  it("rejects assessment question IDs outside the manifest", () => {
    expect(() =>
      applyLessonProgressEvent(
        createEmptyLocalProgressV2(),
        "core.sample-to-generation",
        manifest,
        { type: "assessment-submitted", correct_question_ids: ["q9"] },
        now,
      ),
    ).toThrow("Unknown assessment question: q9");
  });

  it("treats chapter-two progress from revision 3 as obsolete", () => {
    const revisionThreeManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 3,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-2-diagnosis-v2"
                ? "stg.chapter-2-gate"
                : exerciseId,
          ),
      },
    };
    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionThreeManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-1-gate",
        response: {
          type: "field-entry",
          values: { prompt: "6 × 7 = ?" },
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionThreeManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-2-gate",
        response: {
          type: "mapping",
          assignments: { "field-prompt": "owner-dataset" },
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionThreeManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionThreeManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    expect(sampleToGenerationProgressManifest.lesson_revision).toBeGreaterThan(
      revisionThreeManifest.lesson_revision,
    );
    expect(
      oldProgress.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-2-gate"
      ]?.passed,
    ).toBe(true);
    expect(
      oldProgress.lessons["core.sample-to-generation"]?.final_assessment,
    ).not.toBeNull();
    expect(evaluateLessonProgressV2(
      oldProgress.lessons["core.sample-to-generation"],
      sampleToGenerationProgressManifest,
    ).status).toBe("not_started");
  });

  it("starts the current revision fresh on the first chapter-two event and keeps a retried mapping pass sticky across refresh", () => {
    const revisionThreeManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 3,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-2-diagnosis-v2"
                ? "stg.chapter-2-gate"
                : exerciseId,
          ),
      },
    };
    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionThreeManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-2-gate",
        response: {
          type: "mapping",
          assignments: { "field-prompt": "owner-dataset" },
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionThreeManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionThreeManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    const incorrectMapping = {
      "group-index-at-samples-constructed": "raw-generate",
      "status-at-groups-built": "datasource-fanout",
      "reward-at-responses-written": "reward-wrapper",
    };
    const correctMapping = {
      "group-index-at-samples-constructed": "datasource-fanout",
      "status-at-groups-built": "raw-generate",
      "reward-at-responses-written": "reward-wrapper",
    };
    const firstCurrentAttempt = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-2-diagnosis-v2",
        response: { type: "mapping", assignments: incorrectMapping },
        passed: false,
      },
      now,
    );
    const currentLesson = firstCurrentAttempt.lessons["core.sample-to-generation"];
    expect(currentLesson).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      visited_sections: [],
      final_assessment: null,
      exercise_attempts: {
        "stg.chapter-2-diagnosis-v2": {
          attempt_count: 1,
          passed: false,
        },
      },
    });
    expect(currentLesson?.exercise_attempts["stg.chapter-2-gate"]).toBeUndefined();
    expect(
      evaluateLessonProgressV2(currentLesson, sampleToGenerationProgressManifest).status,
    ).toBe("in_progress");

    const { storage } = createStorage();
    saveLocalProgressV2(storage, firstCurrentAttempt);
    const refreshed = loadLocalProgressV2(storage, () => LATER);
    expect(refreshed).toEqual(firstCurrentAttempt);

    const passed = applyLessonProgressEvent(
      refreshed,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-2-diagnosis-v2",
        response: { type: "mapping", assignments: correctMapping },
        passed: true,
      },
      () => LATER,
    );
    expect(
      passed.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-2-diagnosis-v2"
      ],
    ).toMatchObject({
      attempt_count: 2,
      passed: true,
      passed_at: LATER,
      last_response: { type: "mapping", assignments: correctMapping },
    });

    const stillPassed = applyLessonProgressEvent(
      passed,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-2-diagnosis-v2",
        response: { type: "mapping", assignments: incorrectMapping },
        passed: false,
      },
      () => LATEST,
    );
    expect(
      stillPassed.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-2-diagnosis-v2"
      ],
    ).toMatchObject({
      attempt_count: 3,
      passed: true,
      passed_at: LATER,
      last_attempt_at: LATEST,
      last_response: { type: "mapping", assignments: incorrectMapping },
    });
  });

  it("drops revision-four chapter-three semantics and starts the current exercise cleanly", () => {
    const currentChapterThreeExerciseId = sampleToGenerationProgressManifest.completion.required_exercise_ids.find(
      (exerciseId) => exerciseId.startsWith("stg.chapter-3-"),
    );
    expect(currentChapterThreeExerciseId).toBeDefined();
    const revisionFourManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 4,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === currentChapterThreeExerciseId
                ? "stg.chapter-3-gate"
                : exerciseId,
          ),
      },
    };
    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionFourManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-3-gate",
        response: {
          type: "field-entry",
          values: { "a0-group": "0", "a0-index": "0" },
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionFourManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionFourManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    const oldLesson = oldProgress.lessons["core.sample-to-generation"];
    expect(evaluateLessonProgressV2(
      oldLesson,
      sampleToGenerationProgressManifest,
    ).status).toBe("not_started");

    const answer = {
      "a0-group": "0",
      "a0-index": "0",
      "a1-group": "0",
      "a1-index": "1",
      "b0-group": "1",
      "b0-index": "2",
      "b1-group": "1",
      "b1-index": "3",
    };
    const current = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: currentChapterThreeExerciseId!,
        response: { type: "field-entry", values: answer },
        passed: true,
      },
      () => LATER,
    );
    expect(current.lessons["core.sample-to-generation"]).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      final_assessment: null,
      exercise_attempts: {
        [currentChapterThreeExerciseId!]: {
          attempt_count: 1,
          passed: true,
          last_response: { type: "field-entry", values: answer },
        },
      },
    });
    expect(
      current.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-3-gate"
      ],
    ).toBeUndefined();

    const { storage } = createStorage();
    saveLocalProgressV2(storage, current);
    expect(loadLocalProgressV2(storage, () => LATEST)).toEqual(current);
  });

  it("drops revision-five chapter-four semantics and restores the v6 boundary exercise", () => {
    const revisionFiveManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 5,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-4-request-boundary-v2"
                ? "stg.chapter-4-gate"
                : exerciseId,
          ),
      },
    };
    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionFiveManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-4-gate",
        response: {
          type: "ordering",
          ordered_item_ids: ["prepare", "payload", "persist-prefix", "post"],
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionFiveManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionFiveManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    const oldLesson = oldProgress.lessons["core.sample-to-generation"];
    expect(evaluateLessonProgressV2(
      oldLesson,
      sampleToGenerationProgressManifest,
    ).status).toBe("not_started");

    const correctMapping = {
      "prompt-ids": "payload-input",
      "prefix-ledger": "caller-only",
      "sampling-config": "payload-params",
      "logprob-switch": "payload-logprob",
      label: "caller-only",
      identity: "caller-only",
      "reward-null": "not-produced",
      "session-id": "conditional-header",
    };
    const current = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-4-request-boundary-v2",
        response: { type: "mapping", assignments: correctMapping },
        passed: true,
      },
      () => LATER,
    );
    expect(current.lessons["core.sample-to-generation"]).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      final_assessment: null,
      exercise_attempts: {
        "stg.chapter-4-request-boundary-v2": {
          attempt_count: 1,
          passed: true,
          last_response: { type: "mapping", assignments: correctMapping },
        },
      },
    });
    expect(
      current.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-4-gate"
      ],
    ).toBeUndefined();

    const { storage } = createStorage();
    saveLocalProgressV2(storage, current);
    expect(loadLocalProgressV2(storage, () => LATEST)).toEqual(current);

    const stickyPass = applyLessonProgressEvent(
      current,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-4-request-boundary-v2",
        response: {
          type: "mapping",
          assignments: { ...correctMapping, label: "payload-input" },
        },
        passed: false,
      },
      () => LATEST,
    );
    expect(
      stickyPass.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-4-request-boundary-v2"
      ],
    ).toMatchObject({ attempt_count: 2, passed: true, passed_at: LATER });
  });

  it("drops revision-six chapter-five semantics and restores the v7 decoder exercise", () => {
    const revisionSixManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 6,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-5-response-decoder-v2"
                ? "stg.chapter-5-gate"
                : exerciseId,
          ),
      },
    };
    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionSixManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-5-gate",
        response: {
          type: "mapping",
          assignments: {
            "tuple-0": "logprob",
            "tuple-1": "token",
            "output-text": "text",
            finish: "terminal",
          },
        },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionSixManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionSixManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    expect(sampleToGenerationProgressManifest.lesson_revision).toBeGreaterThan(
      revisionSixManifest.lesson_revision,
    );
    expect(evaluateLessonProgressV2(
      oldProgress.lessons["core.sample-to-generation"],
      sampleToGenerationProgressManifest,
    ).status).toBe("not_started");

    const correctValues = {
      "response-tokens": "25,27",
      "response-logprobs": "-0.2,-1.1",
      "sample-response": '""',
      "sample-status": "pending",
      "sample-reward": "None",
    };
    const firstAttempt = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-5-response-decoder-v2",
        response: {
          type: "field-entry",
          values: { ...correctValues, "sample-status": "completed" },
        },
        passed: false,
      },
      () => LATER,
    );
    const currentLesson = firstAttempt.lessons["core.sample-to-generation"];
    expect(currentLesson).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      visited_sections: [],
      final_assessment: null,
      exercise_attempts: {
        "stg.chapter-5-response-decoder-v2": {
          attempt_count: 1,
          passed: false,
        },
      },
    });
    expect(currentLesson?.exercise_attempts["stg.chapter-5-gate"]).toBeUndefined();

    const passed = applyLessonProgressEvent(
      firstAttempt,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-5-response-decoder-v2",
        response: { type: "field-entry", values: correctValues },
        passed: true,
      },
      () => LATEST,
    );
    expect(
      passed.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-5-response-decoder-v2"
      ],
    ).toMatchObject({
      attempt_count: 2,
      passed: true,
      passed_at: LATEST,
      last_response: { type: "field-entry", values: correctValues },
    });

    const { storage } = createStorage();
    saveLocalProgressV2(storage, passed);
    expect(loadLocalProgressV2(storage, now)).toEqual(passed);

    const stickyPass = applyLessonProgressEvent(
      passed,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-5-response-decoder-v2",
        response: {
          type: "field-entry",
          values: { ...correctValues, "sample-reward": "1" },
        },
        passed: false,
      },
      now,
    );
    expect(
      stickyPass.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-5-response-decoder-v2"
      ],
    ).toMatchObject({ attempt_count: 3, passed: true, passed_at: LATEST });
  });

  it("treats v7 chapter-six progress as not started in the v8 lesson", () => {
    const revisionEightManifest: ProgressCompletionManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 8,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        required_exercise_ids:
          sampleToGenerationProgressManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-6-gate"
                ? "stg.chapter-6-writeback-contract-v2"
                : exerciseId,
          ),
      },
    };
    const revisionSevenManifest: ProgressCompletionManifest = {
      ...revisionEightManifest,
      lesson_revision: 7,
      completion: {
        ...revisionEightManifest.completion,
        required_exercise_ids:
          revisionEightManifest.completion.required_exercise_ids.map(
            (exerciseId) =>
              exerciseId === "stg.chapter-6-writeback-contract-v2"
                ? "stg.chapter-6-gate"
                : exerciseId,
          ),
      },
    };
    const correctMapping = {
      tokens: "full-sequence",
      response: "text-stream",
      "response-length": "response-counter",
      "loss-mask": "response-space",
      "rollout-logprobs": "response-space",
      terminal: "terminal-meta",
      reward: "later-producer",
    };
    const incorrectMapping = {
      ...correctMapping,
      terminal: "response-space",
    };

    let oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionSevenManifest,
      { type: "section-visited", section_id: "chapter-6" },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionSevenManifest,
      {
        type: "resume-updated",
        resume: {
          kind: "chaptered",
          chapter_id: "writeback-contract",
          section_id: "reader-contract",
        },
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionSevenManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-6-gate",
        response: { type: "choice", selected_option_ids: ["legacy-reader"] },
        passed: true,
      },
      now,
    );
    oldProgress = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionSevenManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...revisionSevenManifest.completion.final_assessment.question_ids,
        ],
      },
      now,
    );

    const oldLesson = oldProgress.lessons["core.sample-to-generation"];
    expect(oldLesson).toMatchObject({
      lesson_revision: 7,
      visited_sections: ["chapter-6"],
      resume: { kind: "chaptered", chapter_id: "writeback-contract" },
      exercise_attempts: {
        "stg.chapter-6-gate": { attempt_count: 1, passed: true },
      },
    });
    expect(
      evaluateLessonProgressV2(oldLesson, revisionEightManifest).status,
    ).toBe("not_started");
    expect(
      revisionEightManifest.completion.required_exercise_ids,
    ).not.toContain("stg.chapter-6-gate");

    const ignoredStaleSubmission = applyLessonProgressEvent(
      oldProgress,
      "core.sample-to-generation",
      revisionEightManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-6-gate",
        response: { type: "choice", selected_option_ids: ["legacy-reader"] },
        passed: false,
      },
      () => LATER,
    );
    expect(ignoredStaleSubmission).toBe(oldProgress);
    expect(ignoredStaleSubmission).toEqual(oldProgress);

    const firstV8Attempt = applyLessonProgressEvent(
      ignoredStaleSubmission,
      "core.sample-to-generation",
      revisionEightManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-6-writeback-contract-v2",
        response: { type: "mapping", assignments: incorrectMapping },
        passed: false,
      },
      () => LATER,
    );
    const currentLesson = firstV8Attempt.lessons["core.sample-to-generation"];
    expect(currentLesson).toMatchObject({
      lesson_revision: 8,
      visited_sections: [],
      resume: null,
      final_assessment: null,
      exercise_attempts: {
        "stg.chapter-6-writeback-contract-v2": {
          attempt_count: 1,
          passed: false,
        },
      },
    });
    expect(Object.keys(currentLesson?.exercise_attempts ?? {})).toEqual([
      "stg.chapter-6-writeback-contract-v2",
    ]);
    expect(
      currentLesson?.exercise_attempts["stg.chapter-6-gate"],
    ).toBeUndefined();

    const passed = applyLessonProgressEvent(
      firstV8Attempt,
      "core.sample-to-generation",
      revisionEightManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-6-writeback-contract-v2",
        response: { type: "mapping", assignments: correctMapping },
        passed: true,
      },
      () => LATEST,
    );
    expect(
      passed.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-6-writeback-contract-v2"
      ],
    ).toMatchObject({
      attempt_count: 2,
      passed: true,
      passed_at: LATEST,
      last_response: {
        type: "mapping",
        assignments: correctMapping,
      },
    });

    const { storage } = createStorage();
    saveLocalProgressV2(storage, passed);
    const refreshed = loadLocalProgressV2(storage, () => LATEST);
    expect(refreshed).toEqual(passed);

    const stickyPass = applyLessonProgressEvent(
      refreshed,
      "core.sample-to-generation",
      revisionEightManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-6-writeback-contract-v2",
        response: { type: "mapping", assignments: incorrectMapping },
        passed: false,
      },
      () => "2026-08-20T15:00:00.000Z",
    );
    expect(
      stickyPass.lessons["core.sample-to-generation"]?.exercise_attempts[
        "stg.chapter-6-writeback-contract-v2"
      ],
    ).toMatchObject({ attempt_count: 3, passed: true, passed_at: LATEST });
  });

  it("drops all six chapter records when a v1 terminal assessment is replaced by v2", () => {
    const legacyQuestionIds = Array.from(
      { length: 8 },
      (_, index) => `stg.final-q${index + 1}`,
    );
    const legacyRequiredQuestionIds = [
      "stg.final-q2",
      "stg.final-q4",
      "stg.final-q6",
      "stg.final-q8",
    ];
    const v1AssessmentManifest: ProgressCompletionManifest = {
      ...sampleToGenerationProgressManifest,
      completion: {
        ...sampleToGenerationProgressManifest.completion,
        final_assessment: {
          assessment_version: 1,
          question_ids: legacyQuestionIds,
          min_correct: 7,
          required_question_ids: legacyRequiredQuestionIds,
        },
      },
    };

    let legacyProgress = createEmptyLocalProgressV2();
    for (const sectionId of v1AssessmentManifest.completion.required_section_ids) {
      legacyProgress = applyLessonProgressEvent(
        legacyProgress,
        "core.sample-to-generation",
        v1AssessmentManifest,
        { type: "section-visited", section_id: sectionId },
        now,
      );
    }
    for (const exerciseId of v1AssessmentManifest.completion.required_exercise_ids) {
      legacyProgress = applyLessonProgressEvent(
        legacyProgress,
        "core.sample-to-generation",
        v1AssessmentManifest,
        {
          type: "exercise-submitted",
          exercise_id: exerciseId,
          response: { type: "choice", selected_option_ids: ["legacy-pass"] },
          passed: true,
        },
        now,
      );
    }
    legacyProgress = applyLessonProgressEvent(
      legacyProgress,
      "core.sample-to-generation",
      v1AssessmentManifest,
      { type: "assessment-submitted", correct_question_ids: legacyQuestionIds },
      now,
    );

    const legacyLesson = legacyProgress.lessons["core.sample-to-generation"];
    expect(legacyLesson).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      visited_sections: [...sampleToGenerationProgressManifest.completion.required_section_ids],
      final_assessment: {
        assessment_version: 1,
        best_score: 8,
        passed: true,
      },
    });
    expect(Object.keys(legacyLesson?.exercise_attempts ?? {}).sort()).toEqual(
      [...sampleToGenerationProgressManifest.completion.required_exercise_ids].sort(),
    );
    expect(
      evaluateLessonProgressV2(legacyLesson, sampleToGenerationProgressManifest).status,
    ).toBe("not_started");

    expect(() =>
      applyLessonProgressEvent(
        legacyProgress,
        "core.sample-to-generation",
        sampleToGenerationProgressManifest,
        {
          type: "assessment-submitted",
          correct_question_ids: ["stg.final-q1"],
        },
        () => LATER,
      ),
    ).toThrow("Unknown assessment question: stg.final-q1");

    const submittedV2 = applyLessonProgressEvent(
      legacyProgress,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: [
          ...sampleToGenerationProgressManifest.completion.final_assessment.question_ids,
        ],
      },
      () => LATER,
    );
    const v2Lesson = submittedV2.lessons["core.sample-to-generation"];
    expect(v2Lesson).toMatchObject({
      lesson_revision: sampleToGenerationProgressManifest.lesson_revision,
      visited_sections: [],
      exercise_attempts: {},
      final_assessment: {
        assessment_version: 2,
        attempt_count: 1,
        best_score: 8,
        passed: true,
        passed_at: LATER,
      },
    });
    expect(
      evaluateLessonProgressV2(v2Lesson, sampleToGenerationProgressManifest),
    ).toMatchObject({ status: "in_progress", completed: false });

    const missingRequiredOnRetry = sampleToGenerationProgressManifest.completion.final_assessment.question_ids.filter(
      (questionId) => questionId !== "stg.final-q2-v2",
    );
    const stickyPass = applyLessonProgressEvent(
      submittedV2,
      "core.sample-to-generation",
      sampleToGenerationProgressManifest,
      {
        type: "assessment-submitted",
        correct_question_ids: missingRequiredOnRetry,
      },
      () => LATEST,
    );
    expect(stickyPass.lessons["core.sample-to-generation"]?.final_assessment).toMatchObject({
      assessment_version: 2,
      attempt_count: 2,
      last_score: 7,
      best_score: 8,
      last_required_question_ids_passed: false,
      passed: true,
      passed_at: LATER,
      last_attempt_at: LATEST,
    });
    expect(
      evaluateLessonProgressV2(
        stickyPass.lessons["core.sample-to-generation"],
        sampleToGenerationProgressManifest,
      ),
    ).toMatchObject({ status: "in_progress", completed: false });
  });
});

describe("progress v2 storage and migration", () => {
  it("restores a skipped-then-submitted artifact after a storage round trip", () => {
    const { storage } = createStorage();
    let progress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      manifest,
      {
        type: "learning-artifact-recorded",
        artifact_id: "chapter-3-first-judgement",
        status: "skipped",
        response: null,
      },
      now,
    );
    progress = applyLessonProgressEvent(
      progress,
      "core.sample-to-generation",
      manifest,
      {
        type: "learning-artifact-recorded",
        artifact_id: "chapter-3-first-judgement",
        status: "submitted",
        response: {
          type: "mapping",
          assignments: { split_group_members: "relationship" },
        },
      },
      () => LATER,
    );
    saveLocalProgressV2(storage, progress);

    expect(
      loadLocalProgressV2(storage, () => LATEST).lessons[
        "core.sample-to-generation"
      ]?.learning_artifacts?.["chapter-3-first-judgement"],
    ).toEqual({
      status: "submitted",
      response: {
        type: "mapping",
        assignments: { split_group_members: "relationship" },
      },
      submitted_at: LATER,
    });
  });

  it("normalizes a valid pre-artifact v2 lesson with an empty artifact record", () => {
    const current = completeCourse();
    const lesson = current.lessons["core.sample-to-generation"]!;
    const preArtifactLesson = { ...lesson };
    delete preArtifactLesson.learning_artifacts;
    const { storage } = createStorage({
      [LOCAL_PROGRESS_V2_STORAGE_KEY]: JSON.stringify({
        ...current,
        lessons: { "core.sample-to-generation": preArtifactLesson },
      }),
    });
    expect(
      loadLocalProgressV2(storage, now).lessons["core.sample-to-generation"]
        ?.learning_artifacts,
    ).toEqual({});
  });

  it("prefers valid v2 and never reads or removes the legacy value", () => {
    const v2 = completeCourse();
    const legacy = JSON.stringify({ schema_version: 0 });
    const { storage, values } = createStorage({
      [LOCAL_PROGRESS_V2_STORAGE_KEY]: JSON.stringify(v2),
      [LOCAL_PROGRESS_V1_STORAGE_KEY]: legacy,
    });
    expect(loadLocalProgressV2(storage, now)).toEqual(v2);
    expect(values.get(LOCAL_PROGRESS_V1_STORAGE_KEY)).toBe(legacy);
  });

  it("does not resurrect v1 when a v2 value exists but is malformed", () => {
    const { storage } = createStorage({
      [LOCAL_PROGRESS_V2_STORAGE_KEY]: "{not-json",
      [LOCAL_PROGRESS_V1_STORAGE_KEY]: JSON.stringify({
        schema_version: 1,
        lessons: {},
      }),
    });
    expect(loadLocalProgressV2(storage, now)).toEqual(
      createEmptyLocalProgressV2(),
    );
  });

  it("migrates the snake_case v1 envelope with an injected timestamp", () => {
    const legacy = JSON.stringify({
      schema_version: 1,
      lessons: {
        "core.sample-journey": {
          lesson_revision: 7,
          visited_acts: [1, 2, 3],
          assessment_version: 2,
          correct_question_ids: ["q1", "q2"],
          last_event_id: "group-built",
          completed: false,
          review_required: true,
        },
      },
    });
    const { storage, values } = createStorage({
      [LOCAL_PROGRESS_V1_STORAGE_KEY]: legacy,
    });
    const migrated = loadLocalProgressV2(storage, now);
    expect(migrated.lessons["core.sample-journey"]).toMatchObject({
      lesson_revision: 7,
      learning_artifacts: {},
      visited_sections: ["act-1", "act-2", "act-3"],
      updated_at: NOW,
      resume: {
        kind: "sample-journey",
        event_id: "group-built",
        selected_sample_id: "a0",
      },
    });
    expect(values.get(LOCAL_PROGRESS_V1_STORAGE_KEY)).toBe(legacy);
    expect(values.has(LOCAL_PROGRESS_V2_STORAGE_KEY)).toBe(true);
  });

  it("migrates the flat camelCase JourneyExperience shape", () => {
    const { storage } = createStorage({
      [LOCAL_PROGRESS_V1_STORAGE_KEY]: JSON.stringify({
        schemaVersion: 1,
        lessonId: "core.sample-journey",
        lessonVersion: "7",
        assessmentVersion: "2",
        fixtureId: "math-2x2-v1",
        status: "completed",
        visitedActs: [1, 2, 3, 4, 5, 6, 7],
        lastEventId: "next-cycle-ready",
        selectedSampleId: "a1",
        timelineMode: "async",
        answers: { q1: ["sample"] },
        bestScore: 8,
        lastScore: 8,
        requiredQuestionsPassed: true,
        updatedAt: "2026-08-19T08:00:00.000Z",
      }),
    });
    const migrated = loadLocalProgressV2(storage, now);
    expect(migrated.lessons["core.sample-journey"]).toMatchObject({
      lesson_revision: 7,
      learning_artifacts: {},
      visited_sections: [
        "act-1",
        "act-2",
        "act-3",
        "act-4",
        "act-5",
        "act-6",
        "act-7",
      ],
      final_assessment: {
        assessment_version: 2,
        best_score: 8,
        passed: true,
      },
      exercise_attempts: {
        q1: {
          last_response: {
            type: "choice",
            selected_option_ids: ["sample"],
          },
          passed: false,
        },
      },
      resume: {
        kind: "sample-journey",
        event_id: "next-cycle-ready",
        selected_sample_id: "a1",
        timeline_mode: "async",
      },
      updated_at: "2026-08-19T08:00:00.000Z",
    });
  });

  it("clears one lesson without overwriting another", () => {
    const firstLesson = completeCourse();
    const twoLessons = applyLessonProgressEvent(
      firstLesson,
      "core.sample-journey",
      { ...manifest, lesson_revision: 7 },
      { type: "section-visited", section_id: "act-1" },
      now,
    );
    const { storage, values } = createStorage();
    saveLocalProgressV2(storage, twoLessons);
    const cleared = clearLessonProgressV2(
      storage,
      "core.sample-to-generation",
      now,
    );
    expect(cleared.lessons["core.sample-to-generation"]).toBeUndefined();
    expect(cleared.lessons["core.sample-journey"]).toBeDefined();
    expect(
      LocalProgressV2Schema.parse(
        JSON.parse(values.get(LOCAL_PROGRESS_V2_STORAGE_KEY) ?? ""),
      ),
    ).toEqual(cleared);
  });
});
