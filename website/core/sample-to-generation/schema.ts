import { z } from "zod";

export const SAMPLE_TO_GENERATION_OBSERVATIONS = [
  "rows-read",
  "samples-constructed",
  "groups-built",
  "prompts-tokenized",
  "requests-prepared",
  "responses-received",
  "responses-written",
] as const;

export const SampleToGenerationObservationIdSchema = z.enum(
  SAMPLE_TO_GENERATION_OBSERVATIONS,
);

const MetadataSchema = z.record(z.string(), z.unknown());

export const TeachingRowSchema = z
  .object({
    origin_id: z.string().min(1),
    text: z.string().min(1),
    label: z.string().min(1),
    metadata: MetadataSchema,
  })
  .strict();

export const TeachingTokenizerSchema = z
  .object({
    kind: z.literal("teaching-only"),
    notice: z.string().min(1),
    vocabulary: z.array(
      z.object({ id: z.number().int(), piece: z.string() }).strict(),
    ),
    prompt_encodings: z.record(z.string().min(1), z.array(z.number().int()).min(1)),
  })
  .strict();

export const SampleToGenerationSampleSchema = z
  .object({
    origin_id: z.string().min(1),
    group_index: z.number().int().nonnegative().nullable(),
    index: z.number().int().nonnegative().nullable(),
    prompt: z.string().min(1),
    tokens: z.array(z.number().int()),
    multimodal_inputs: z.null(),
    response: z.string(),
    response_length: z.number().int().nonnegative(),
    label: z.string().min(1).nullable(),
    reward: z.null(),
    loss_mask: z.array(z.union([z.literal(0), z.literal(1)])).nullable(),
    weight_versions: z.array(z.string().min(1)),
    rollout_log_probs: z.array(z.number()).nullable(),
    status: z.enum(["pending", "completed"]),
    metadata: MetadataSchema,
    train_metadata: z.null(),
  })
  .strict();

export const SamplingParamsSchema = z
  .object({
    temperature: z.number(),
    top_p: z.number(),
    top_k: z.number().int(),
    max_new_tokens: z.number().int().positive(),
    stop: z.array(z.string()),
    stop_token_ids: z.array(z.number().int()),
    skip_special_tokens: z.boolean(),
    no_stop_trim: z.boolean(),
    spaces_between_special_tokens: z.boolean(),
  })
  .strict();

export const SglangPayloadSchema = z
  .object({
    input_ids: z.array(z.number().int()).min(1),
    sampling_params: SamplingParamsSchema,
    return_logprob: z.literal(true),
  })
  .strict();

export const RequestSidecarSchema = z
  .object({
    sample_id: z.string().min(1),
    method: z.literal("POST"),
    endpoint: z.literal("/generate"),
    payload: SglangPayloadSchema,
  })
  .strict();

export const ResponseProjectionSchema = z
  .object({
    sample_id: z.string().min(1),
    text: z.string(),
    output_token_logprobs: z.array(
      z.tuple([z.number(), z.number().int()]),
    ),
    finish_reason: z.literal("stop"),
    weight_version: z.literal("actor@0"),
  })
  .strict();

export const ResponseWriteSchema = z
  .object({
    sample_id: z.string().min(1),
    text: z.string(),
    tokens: z.array(z.number().int()).min(1),
    log_probabilities: z.array(z.number()).min(1),
    finish_reason: z.literal("stop"),
    weight_version: z.literal("actor@0"),
  })
  .strict();

export const SampleToGenerationObservationSchema = z
  .object({
    id: SampleToGenerationObservationIdSchema,
    chapter: z.number().int().min(1).max(6),
    actor: z.enum(["file-reader", "dataset", "data-source", "tokenizer", "sglang-request", "sglang", "sample"]),
    source_ref_ids: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const SampleToGenerationFixtureSchema = z
  .object({
    schema_version: z.literal("sample-to-generation/1"),
    fixture_id: z.literal("sample-to-generation-2x2-v1"),
    slime_ref: z
      .object({
        tag: z.literal("v0.3.1"),
        describe: z.literal("v0.3.1-1-g06ffdbe2"),
        commit: z.literal("06ffdbe22be068b52f9ed0fc318c473f7030197e"),
      })
      .strict(),
    teaching_notice: z.string().min(1),
    tokenizer: TeachingTokenizerSchema,
    rows: z.array(TeachingRowSchema).length(2),
    group_plan: z.array(
      z
        .object({
          origin_id: z.string().min(1),
          group_index: z.number().int().nonnegative(),
          members: z
            .array(
              z
                .object({
                  sample_id: z.string().min(1),
                  index: z.number().int().nonnegative(),
                })
                .strict(),
            )
            .length(2),
        })
        .strict(),
    ).length(2),
    sampling_params: SamplingParamsSchema,
    response_projections: z.array(ResponseProjectionSchema).length(4),
    observations: z.array(SampleToGenerationObservationSchema).length(
      SAMPLE_TO_GENERATION_OBSERVATIONS.length,
    ),
    expected: z
      .object({
        origins: z.literal(2),
        groups: z.literal(2),
        samples_per_group: z.literal(2),
        physical_samples: z.literal(4),
        generator_weight_version: z.literal("actor@0"),
      })
      .strict(),
  })
  .strict()
  .superRefine((fixture, context) => {
    const originIds = fixture.rows.map((row) => row.origin_id);
    if (new Set(originIds).size !== originIds.length) {
      context.addIssue({ code: "custom", path: ["rows"], message: "origin IDs must be unique" });
    }

    const vocabularyIds = fixture.tokenizer.vocabulary.map((entry) => entry.id);
    if (new Set(vocabularyIds).size !== vocabularyIds.length) {
      context.addIssue({
        code: "custom",
        path: ["tokenizer", "vocabulary"],
        message: "teaching-tokenizer IDs must be unique",
      });
    }

    for (const originId of originIds) {
      if (!fixture.tokenizer.prompt_encodings[originId]) {
        context.addIssue({
          code: "custom",
          path: ["tokenizer", "prompt_encodings", originId],
          message: "every origin requires one prompt encoding",
        });
      }
    }

    const groupOrigins = fixture.group_plan.map((group) => group.origin_id);
    if (
      groupOrigins.length !== originIds.length ||
      groupOrigins.some((originId) => !originIds.includes(originId)) ||
      new Set(groupOrigins).size !== groupOrigins.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["group_plan"],
        message: "group plan must cover each origin exactly once",
      });
    }

    const groupIndices = fixture.group_plan.map((group) => group.group_index);
    if (new Set(groupIndices).size !== groupIndices.length) {
      context.addIssue({
        code: "custom",
        path: ["group_plan"],
        message: "group indices must be unique",
      });
    }

    const members = fixture.group_plan.flatMap((group) => group.members);
    const sampleIds = members.map((member) => member.sample_id);
    const sampleIndices = members.map((member) => member.index);
    if (
      new Set(sampleIds).size !== fixture.expected.physical_samples ||
      new Set(sampleIndices).size !== fixture.expected.physical_samples
    ) {
      context.addIssue({
        code: "custom",
        path: ["group_plan"],
        message: "physical sample IDs and indices must be unique",
      });
    }

    const projectionIds = fixture.response_projections.map(
      (projection) => projection.sample_id,
    );
    if (
      projectionIds.length !== sampleIds.length ||
      projectionIds.some((sampleId) => !sampleIds.includes(sampleId)) ||
      new Set(projectionIds).size !== projectionIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["response_projections"],
        message: "response projections must cover each physical sample exactly once",
      });
    }

    fixture.observations.forEach((observation, index) => {
      if (observation.id !== SAMPLE_TO_GENERATION_OBSERVATIONS[index]) {
        context.addIssue({
          code: "custom",
          path: ["observations", index, "id"],
          message: `expected observation ${SAMPLE_TO_GENERATION_OBSERVATIONS[index]}`,
        });
      }
    });
  });

export type SampleToGenerationObservationId = z.infer<
  typeof SampleToGenerationObservationIdSchema
>;
export type TeachingRow = z.infer<typeof TeachingRowSchema>;
export type TeachingTokenizer = z.infer<typeof TeachingTokenizerSchema>;
export type SampleToGenerationSample = z.infer<
  typeof SampleToGenerationSampleSchema
>;
export type SamplingParams = z.infer<typeof SamplingParamsSchema>;
export type SglangPayload = z.infer<typeof SglangPayloadSchema>;
export type RequestSidecar = z.infer<typeof RequestSidecarSchema>;
export type ResponseProjection = z.infer<typeof ResponseProjectionSchema>;
export type ResponseWrite = z.infer<typeof ResponseWriteSchema>;
export type SampleToGenerationObservation = z.infer<
  typeof SampleToGenerationObservationSchema
>;
export type SampleToGenerationFixture = z.infer<
  typeof SampleToGenerationFixtureSchema
>;
