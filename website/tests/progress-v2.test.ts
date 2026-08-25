import { describe, expect, it } from "vitest";

import { sampleToGenerationProgressManifest } from "@/content/zh/course-progress-manifests";

import {
  LOCAL_PROGRESS_V1_STORAGE_KEY,
  LOCAL_PROGRESS_V2_STORAGE_KEY,
  LocalProgressV2Schema,
  StructuredExerciseResponseSchema,
  applyLessonProgressEvent,
  clearLessonProgressV2,
  createEmptyLocalProgressV2,
  evaluateLessonProgressV2,
  loadLocalProgressV2,
  saveLocalProgressV2,
  type ProgressCompletionManifest,
  type ProgressStorage,
} from "@/core/progress";

const NOW = "2026-08-20T12:00:00.000Z";
const LATER = "2026-08-20T13:00:00.000Z";
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
});

describe("progress v2 completion", () => {
  it("derives not-started, in-progress, completed, and review-required", () => {
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
    ).toBe("review_required");
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
    ).toBe("review_required");
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

  it("requires review after the chapter-one mapping exercise becomes a field-entry migration", () => {
    const revisionTwoManifest = {
      ...sampleToGenerationProgressManifest,
      lesson_revision: 2,
    };
    const oldProgress = applyLessonProgressEvent(
      createEmptyLocalProgressV2(),
      "core.sample-to-generation",
      revisionTwoManifest,
      {
        type: "exercise-submitted",
        exercise_id: "stg.chapter-1-gate",
        response: {
          type: "mapping",
          assignments: { "prompt-expression": "sample-prompt" },
        },
        passed: true,
      },
      now,
    );
    expect(sampleToGenerationProgressManifest.lesson_revision).toBe(3);
    expect(evaluateLessonProgressV2(
      oldProgress.lessons["core.sample-to-generation"],
      sampleToGenerationProgressManifest,
    ).status).toBe("review_required");
  });
});

describe("progress v2 storage and migration", () => {
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
