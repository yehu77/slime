import { z } from "zod";

export const JOURNEY_PHASES = [
  "ready",
  "group_built",
  "request_prepared",
  "generating",
  "terminal",
  "rewarded_collected",
  "train_data_built",
  "scheduled",
  "trained",
  "weights_synced",
  "next_cycle_ready",
] as const;

export const JourneyPhaseSchema = z.enum(JOURNEY_PHASES);
export const JourneyActorSchema = z.enum([
  "dataset",
  "data_source",
  "router",
  "sglang",
  "reward",
  "rollout_manager",
  "scheduler",
  "actor",
  "weight_sync",
]);
export const SampleStatusSchema = z.enum([
  "pending",
  "completed",
  "truncated",
  "aborted",
  "failed",
]);

export const LocalizedTextRefSchema = z
  .object({ copy_key: z.string().min(1) })
  .strict();

const MetadataSchema = z.record(z.string(), z.unknown());
const RewardSchema = z.union([z.number(), MetadataSchema]).nullable();

export const SampleSnapshotSchema = z
  .object({
    group_index: z.number().int().nonnegative().nullable(),
    index: z.number().int().nonnegative().nullable(),
    rollout_id: z.number().int().nonnegative().nullable(),
    prompt: z.string(),
    tokens: z.array(z.number().int()),
    response: z.string(),
    response_length: z.number().int().nonnegative(),
    label: z.string().nullable(),
    reward: RewardSchema,
    loss_mask: z.array(z.number()).nullable(),
    weight_versions: z.array(z.string()),
    rollout_log_probs: z.array(z.number()).nullable(),
    remove_sample: z.boolean(),
    status: SampleStatusSchema,
    metadata: MetadataSchema,
    train_metadata: MetadataSchema.nullable(),
    session_id: z.string().nullable(),
  })
  .strict();

export const SerializedSampleSnapshotSchema = SampleSnapshotSchema.omit({
  prompt: true,
})
  .extend({ prompt: LocalizedTextRefSchema })
  .strict();

const PatchPathSchema = z.enum([
  "/group_index",
  "/index",
  "/rollout_id",
  "/prompt",
  "/tokens",
  "/response",
  "/response_length",
  "/label",
  "/reward",
  "/loss_mask",
  "/weight_versions",
  "/rollout_log_probs",
  "/remove_sample",
  "/status",
  "/metadata",
  "/train_metadata",
  "/session_id",
]);

export const SamplePatchSchema = z
  .object({
    sample_id: z.string().min(1),
    op: z.enum(["add", "replace"]),
    path: PatchPathSchema,
    value: z.unknown(),
  })
  .strict();

export const TrainDataSchema = z
  .object({
    sample_ids: z.array(z.string().min(1)),
    tokens: z.array(z.array(z.number().int())),
    response_lengths: z.array(z.number().int().nonnegative()),
    raw_reward: z.array(z.number()),
    rewards: z.array(z.number()),
    truncated: z.array(z.union([z.literal(0), z.literal(1)])),
    sample_indices: z.array(z.number().int().nonnegative()),
    rollout_ids: z.array(z.number().int().nonnegative()),
    loss_masks: z.array(z.array(z.number())),
    rollout_mask_sums: z.array(z.number().nonnegative()),
  })
  .strict()
  .superRefine((data, context) => {
    const lengths = [
      data.tokens.length,
      data.response_lengths.length,
      data.raw_reward.length,
      data.rewards.length,
      data.truncated.length,
      data.sample_indices.length,
      data.rollout_ids.length,
      data.loss_masks.length,
      data.rollout_mask_sums.length,
    ];
    if (lengths.some((length) => length !== data.sample_ids.length)) {
      context.addIssue({
        code: "custom",
        message: "All train-data columns must align with sample_ids",
      });
    }
  });

export const TrainingScheduleSchema = z
  .object({
    steps: z.array(
      z
        .object({
          step_index: z.number().int().nonnegative(),
          rollout_ids: z.array(z.number().int().nonnegative()).min(1),
          sample_ids: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ),
    used_rollouts: z.number().int().nonnegative(),
    trimmed_rollouts: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((schedule, context) => {
    schedule.steps.forEach((step, index) => {
      if (step.rollout_ids.length !== step.sample_ids.length) {
        context.addIssue({
          code: "custom",
          path: ["steps", index],
          message: "Each scheduled rollout must align with one physical sample",
        });
      }
    });
  });

export const DerivedJourneyStateSchema = z
  .object({
    train_data: TrainDataSchema.nullable(),
    schedule: TrainingScheduleSchema.nullable(),
  })
  .strict();

export const SystemJourneyStateSchema = z
  .object({
    actor_version: z.string().min(1),
    rollout_version: z.string().min(1),
    actor_training_state: z.enum(["idle", "training", "trained"]),
    weights_published: z.boolean(),
    next_cycle_ready: z.boolean(),
    raw_samples_frozen: z.boolean(),
  })
  .strict();

export const JourneyEventSchema = z
  .object({
    id: z.string().min(1),
    phase: JourneyPhaseSchema,
    act: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
    ]),
    actor: JourneyActorSchema,
    sample_ids: z.array(z.string().min(1)),
    sample_patches: z.array(SamplePatchSchema),
    derived_patch: DerivedJourneyStateSchema.partial().optional(),
    system_patch: SystemJourneyStateSchema.partial().optional(),
    title_key: z.string().min(1),
    narration_key: z.string().min(1),
    transcript_key: z.string().min(1),
    source_ref_ids: z.array(z.string().min(1)),
  })
  .strict();

export const JourneyFixtureSchema = z
  .object({
    schema_version: z.literal("sample-journey/1"),
    fixture_id: z.literal("math-2x2-v1"),
    slime_ref: z
      .object({
        tag: z.literal("v0.3.1"),
        describe: z.literal("v0.3.1-1-g06ffdbe2"),
        commit: z.literal("06ffdbe22be068b52f9ed0fc318c473f7030197e"),
      })
      .strict(),
    copy_namespace: z.literal("sample-journey"),
    teaching_values_notice_key: z.string().min(1),
    config: z
      .object({
        rollout_batch_size: z.literal(2),
        n_samples_per_prompt: z.literal(2),
        global_batch_size: z.literal(2),
        num_steps_per_rollout: z.literal(2),
        dp_size: z.literal(1),
        micro_batch_size: z.literal(2),
        use_dynamic_batch_size: z.literal(false),
        advantage_estimator: z.literal("grpo"),
        rewards_normalization: z.literal(true),
        grpo_std_normalization: z.literal(false),
        prompt_key: z.literal("text"),
        label_key: z.literal("label"),
        metadata_key: z.literal("metadata"),
        apply_chat_template: z.literal(false),
        partial_rollout: z.literal(false),
        group_rm: z.literal(false),
      })
      .strict(),
    vocabulary: z.array(
      z.object({ id: z.number().int(), piece: z.string() }).strict(),
    ),
    initial_samples: z.record(z.string().min(1), SerializedSampleSnapshotSchema),
    initial_derived: DerivedJourneyStateSchema,
    initial_system: SystemJourneyStateSchema,
    groups: z.array(
      z
        .object({
          group_index: z.number().int().nonnegative(),
          sample_ids: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ),
    events: z.array(JourneyEventSchema).length(JOURNEY_PHASES.length),
    expected: z
      .object({
        prompt_groups: z.literal(2),
        logical_rollouts: z.literal(4),
        physical_samples: z.literal(4),
        train_steps: z.literal(2),
        trimmed_rollouts: z.literal(0),
      })
      .strict(),
  })
  .strict()
  .superRefine((fixture, context) => {
    const eventIds = fixture.events.map((event) => event.id);
    if (new Set(eventIds).size !== eventIds.length) {
      context.addIssue({
        code: "custom",
        path: ["events"],
        message: "Journey event IDs must be unique",
      });
    }
    fixture.events.forEach((event, index) => {
      if (event.phase !== JOURNEY_PHASES[index]) {
        context.addIssue({
          code: "custom",
          path: ["events", index, "phase"],
          message: `Expected phase ${JOURNEY_PHASES[index]}`,
        });
      }
      if (event.id !== event.phase) {
        context.addIssue({
          code: "custom",
          path: ["events", index, "id"],
          message: "M1 event IDs must match their stable phase IDs",
        });
      }
    });

    const sampleIds = new Set(Object.keys(fixture.initial_samples));
    const groupedIds = fixture.groups.flatMap((group) => group.sample_ids);
    if (
      groupedIds.length !== sampleIds.size ||
      new Set(groupedIds).size !== groupedIds.length ||
      groupedIds.some((sampleId) => !sampleIds.has(sampleId))
    ) {
      context.addIssue({
        code: "custom",
        path: ["groups"],
        message: "groups must contain every initial sample exactly once",
      });
    }
    if (
      sampleIds.size !== fixture.expected.physical_samples ||
      fixture.groups.length !== fixture.expected.prompt_groups ||
      fixture.groups.some(
        (group) =>
          group.sample_ids.length !== fixture.config.n_samples_per_prompt,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["expected"],
        message: "Fixture groups and samples must match the declared 2x2 shape",
      });
    }

    const vocabularyIds = fixture.vocabulary.map((token) => token.id);
    if (new Set(vocabularyIds).size !== vocabularyIds.length) {
      context.addIssue({
        code: "custom",
        path: ["vocabulary"],
        message: "Teaching vocabulary token IDs must be unique",
      });
    }

    fixture.events.forEach((event, eventIndex) => {
      for (const sampleId of event.sample_ids) {
        if (!sampleIds.has(sampleId)) {
          context.addIssue({
            code: "custom",
            path: ["events", eventIndex, "sample_ids"],
            message: `Unknown sample ID ${sampleId}`,
          });
        }
      }
      for (const patch of event.sample_patches) {
        if (!sampleIds.has(patch.sample_id)) {
          context.addIssue({
            code: "custom",
            path: ["events", eventIndex, "sample_patches"],
            message: `Patch targets unknown sample ID ${patch.sample_id}`,
          });
        }
      }
    });
  });

export type JourneyPhase = z.infer<typeof JourneyPhaseSchema>;
export type JourneyActor = z.infer<typeof JourneyActorSchema>;
export type SampleStatus = z.infer<typeof SampleStatusSchema>;
export type LocalizedTextRef = z.infer<typeof LocalizedTextRefSchema>;
export type SampleSnapshot = z.infer<typeof SampleSnapshotSchema>;
export type SerializedSampleSnapshot = z.infer<
  typeof SerializedSampleSnapshotSchema
>;
export type SamplePatch = z.infer<typeof SamplePatchSchema>;
export type TrainData = z.infer<typeof TrainDataSchema>;
export type TrainingSchedule = z.infer<typeof TrainingScheduleSchema>;
export type DerivedJourneyState = z.infer<typeof DerivedJourneyStateSchema>;
export type SystemJourneyState = z.infer<typeof SystemJourneyStateSchema>;
export type JourneyEvent = z.infer<typeof JourneyEventSchema>;
export type JourneyFixture = z.infer<typeof JourneyFixtureSchema>;

export type RuntimeJourneyEvent = JourneyEvent & {
  title: string;
  narration: string;
  transcript: string;
};

export type RuntimeJourneyFixture = Omit<
  JourneyFixture,
  "initial_samples" | "events"
> & {
  teaching_values_notice: string;
  initial_samples: Record<string, SampleSnapshot>;
  events: RuntimeJourneyEvent[];
};
