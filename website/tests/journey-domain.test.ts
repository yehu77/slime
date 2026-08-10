import { describe, expect, it } from "vitest";

import {
  JOURNEY_PHASES,
  JourneyFixtureSchema,
  calculateBatch,
  checkJourneyInvariants,
  createInitialJourneyState,
  getJourneyStateHash,
  materializeJourneyFixture,
  materializeJourneyStates,
  math2x2Fixture,
  reduceJourney,
  seekJourney,
} from "@/core/journey";
import {
  LOCAL_PROGRESS_STORAGE_KEY,
  createEmptyLocalProgress,
  createEmptyLessonProgress,
  evaluateLessonCompletion,
  loadLocalProgress,
  saveLocalProgress,
  updateLessonProgress,
  type StorageLike,
} from "@/core/progress";
import { sampleJourneyMessages } from "@/content/zh/messages/sample-journey";

function fixtureMessages(): Record<string, string> {
  const keys = new Set<string>([math2x2Fixture.teaching_values_notice_key]);
  for (const sample of Object.values(math2x2Fixture.initial_samples)) {
    keys.add(sample.prompt.copy_key);
  }
  for (const event of math2x2Fixture.events) {
    keys.add(event.title_key);
    keys.add(event.narration_key);
    keys.add(event.transcript_key);
  }
  return Object.fromEntries([...keys].map((key) => [key, `copy:${key}`]));
}

const runtimeFixture = materializeJourneyFixture(
  math2x2Fixture,
  fixtureMessages(),
);

describe("math-2x2-v1 fixture", () => {
  it("validates four samples and the exact eleven-phase sequence", () => {
    expect(JourneyFixtureSchema.parse(math2x2Fixture)).toEqual(math2x2Fixture);
    expect(Object.keys(math2x2Fixture.initial_samples)).toEqual([
      "a0",
      "a1",
      "b0",
      "b1",
    ]);
    expect(math2x2Fixture.events.map((event) => event.phase)).toEqual(
      JOURNEY_PHASES,
    );
  });

  it("rejects an incomplete locale overlay", () => {
    expect(() => materializeJourneyFixture(math2x2Fixture, {})).toThrow(
      /Missing locale message/,
    );
  });

  it("materializes the complete zh-CN overlay without copying fixture facts", () => {
    const localized = materializeJourneyFixture(
      math2x2Fixture,
      sampleJourneyMessages,
    );
    expect(localized.initial_samples.a0.prompt).toBe("3 + 2 = ? 只输出整数。");
    expect(localized.events[0]).toMatchObject({
      title: "出生：一行数据有了框架内的形状",
      phase: "ready",
    });
    expect(localized.teaching_values_notice).toContain("教学 fixture");
  });
});

describe("journey reducer", () => {
  it("materializes raw, derived, and system state without mixing layers", () => {
    const grouped = seekJourney(runtimeFixture, "group_built");
    expect(Object.values(grouped.raw_samples).map((sample) => sample.index)).toEqual([
      0,
      1,
      2,
      3,
    ]);
    expect(
      Object.values(grouped.raw_samples).map((sample) => sample.group_index),
    ).toEqual([0, 0, 1, 1]);
    expect(grouped.raw_samples.a0.metadata).not.toBe(
      grouped.raw_samples.a1.metadata,
    );

    const generating = seekJourney(runtimeFixture, "generating");
    expect(generating.raw_samples.a0).toMatchObject({
      tokens: [11, 12, 13, 14, 15, 25],
      response: "5",
      response_length: 1,
      loss_mask: [1],
      rollout_log_probs: [-0.08],
      reward: null,
      status: "pending",
    });
    expect(generating.derived.train_data).toBeNull();
    expect(generating.system.actor_version).toBe("actor@0");

    const terminal = seekJourney(runtimeFixture, "terminal");
    expect(terminal.raw_samples.a0.status).toBe("completed");
    expect(terminal.raw_samples.a0.weight_versions).toEqual(["actor@0"]);

    const built = seekJourney(runtimeFixture, "train_data_built");
    expect(built.raw_samples.a0.reward).toBe(1);
    expect(built.raw_samples.a0.rollout_id).toBeNull();
    expect(built.derived.train_data?.rollout_ids).toEqual([0, 1, 2, 3]);
    expect(built.derived.train_data?.rewards).toEqual([
      0.5,
      -0.5,
      0.5,
      -0.5,
    ]);
    expect(built.system.raw_samples_frozen).toBe(true);
  });

  it("supports deterministic next, previous, seek, reset, and selection", () => {
    const initial = createInitialJourneyState(runtimeFixture);
    const next = reduceJourney(initial, { type: "next" }, runtimeFixture);
    expect(next.event_id).toBe("group_built");

    const selected = reduceJourney(
      next,
      { type: "select_sample", sample_id: "b1" },
      runtimeFixture,
    );
    const sought = reduceJourney(
      selected,
      { type: "seek", event_id: "trained" },
      runtimeFixture,
    );
    expect(sought.selected_sample_id).toBe("b1");
    expect(sought.system.actor_version).toBe("actor@1");
    expect(sought.system.rollout_version).toBe("actor@0");
    expect(sought.system.weights_published).toBe(false);

    const synced = reduceJourney(
      sought,
      { type: "seek", event_id: "weights_synced" },
      runtimeFixture,
    );
    expect(synced.system.rollout_version).toBe("actor@1");
    expect(synced.system.weights_published).toBe(true);

    const previous = reduceJourney(
      sought,
      { type: "previous" },
      runtimeFixture,
    );
    expect(previous.event_id).toBe("scheduled");

    const reset = reduceJourney(previous, { type: "reset" }, runtimeFixture);
    expect(reset.event_id).toBe("ready");
    expect(reset.selected_sample_id).toBe("b1");
  });

  it("replays every state with a stable hash and no failed invariants", () => {
    const firstPass = materializeJourneyStates(runtimeFixture);
    const secondPass = materializeJourneyStates(runtimeFixture);
    expect(firstPass.map(getJourneyStateHash)).toEqual(
      secondPass.map(getJourneyStateHash),
    );
    expect(new Set(firstPass.map(getJourneyStateHash)).size).toBe(11);
    expect(
      firstPass.flatMap(checkJourneyInvariants).filter(
        (result) => result.status === "fail",
      ),
    ).toEqual([]);
  });
});

describe("batch conservation calculator", () => {
  it("computes the default four rollouts as two complete steps", () => {
    expect(
      calculateBatch({
        prompt_groups: 2,
        samples_per_prompt: 2,
        global_batch_size: 2,
        physical_samples: 4,
        dp_size: 1,
      }),
    ).toMatchObject({
      valid: true,
      logical_rollouts: 4,
      train_steps: 2,
      used_rollouts: 4,
      trimmed_rollouts: 0,
      warnings: [],
      errors: [],
    });
  });

  it("reports that P=3, N=2, G=4 uses four and trims two", () => {
    const result = calculateBatch({
      prompt_groups: 3,
      samples_per_prompt: 2,
      global_batch_size: 4,
    });
    expect(result).toMatchObject({
      valid: true,
      logical_rollouts: 6,
      train_steps: 1,
      used_rollouts: 4,
      trimmed_rollouts: 2,
    });
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "trailing-rollouts-trimmed",
    );
  });

  it("derives global batch size in requested-step mode", () => {
    expect(
      calculateBatch({
        prompt_groups: 2,
        samples_per_prompt: 2,
        mode: "num_steps",
        num_steps_per_rollout: 2,
      }),
    ).toMatchObject({
      valid: true,
      global_batch_size: 2,
      requested_steps: 2,
      train_steps: 2,
    });
  });

  it("blocks invalid integer input", () => {
    const result = calculateBatch({
      prompt_groups: 0,
      samples_per_prompt: 2,
      global_batch_size: 2,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe("invalid-prompt_groups");
  });
});

describe("versioned local progress", () => {
  const requirements = {
    min_correct: 7,
    required_question_ids: ["q4", "q5", "q8"],
    required_acts: [1, 2, 3, 4, 5, 6, 7],
  } as const;

  it("requires all acts, seven correct answers, and q4/q5/q8", () => {
    const incomplete = createEmptyLessonProgress();
    expect(evaluateLessonCompletion(incomplete, requirements).completed).toBe(
      false,
    );

    const progress = updateLessonProgress(
      createEmptyLocalProgress(),
      "core.sample-journey",
      {
        visited_acts: [7, 1, 2, 3, 4, 5, 6],
        assessment_version: 1,
        correct_question_ids: ["q1", "q2", "q3", "q4", "q5", "q8", "q9"],
        last_event_id: "next_cycle_ready",
      },
      requirements,
    );
    expect(progress.lessons["core.sample-journey"]).toMatchObject({
      visited_acts: [1, 2, 3, 4, 5, 6, 7],
      completed: true,
      review_required: false,
    });
  });

  it("saves valid data and ignores invalid or old storage", () => {
    const values = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: (key) => void values.delete(key),
    };
    const progress = createEmptyLocalProgress();
    saveLocalProgress(storage, progress);
    expect(loadLocalProgress(storage)).toEqual(progress);

    values.set(
      LOCAL_PROGRESS_STORAGE_KEY,
      JSON.stringify({ schema_version: 0, lessons: { stale: true } }),
    );
    expect(loadLocalProgress(storage)).toEqual(createEmptyLocalProgress());
  });
});
