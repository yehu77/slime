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
    status: z.enum(["pending", "completed", "truncated", "aborted"]),
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

const OutputTokenLogProbTupleSchema = z
  .tuple([z.number(), z.number().int()])
  .rest(z.unknown());

export const SglangFinishReasonSchema = z
  .object({ type: z.enum(["stop", "length", "abort"]) })
  .passthrough();

/**
 * Keep the complete server-owned envelope intact. The fields we teach are
 * typed explicitly, while `.passthrough()` preserves SGLang metadata that
 * this course does not interpret (for example cache or replay details).
 */
export const SglangResponseMetaInfoSchema = z
  .object({
    output_token_logprobs: z
      .array(OutputTokenLogProbTupleSchema)
      .optional(),
    finish_reason: SglangFinishReasonSchema,
    weight_version: z.string().min(1).optional(),
  })
  .passthrough();

/**
 * The HTTP body returned by SGLang. `sample_id` deliberately does not live
 * here: SGLang does not know which caller-owned Sample receives this body.
 */
export const SglangResponseBodySchema = z
  .object({
    text: z.string(),
    meta_info: SglangResponseMetaInfoSchema,
  })
  .strict();

/** A caller-owned association plus the unmodified HTTP body it received. */
export const ResponseReceiptSchema = z
  .object({
    sample_id: z.string().min(1),
    raw_body: SglangResponseBodySchema,
  })
  .strict();

/**
 * Course-side evidence decoded from a receipt. It is deliberately not a
 * Sample: Chapter 6 consumes this material to write the Sample later.
 */
export const ResponseEvidenceSchema = z
  .object({
    sample_id: z.string().min(1),
    text: z.string(),
    tokens: z.array(z.number().int()),
    log_probabilities: z.array(z.number()),
    // This is the same complete envelope carried by the receipt, not a
    // hand-picked subset. Chapter 6 can read its typed terminal fields while
    // downstream consumers still retain every server-provided datum.
    meta_info: SglangResponseMetaInfoSchema,
  })
  .strict();

/**
 * The writeback boundary accepts the same normalized evidence shape. Keeping
 * a named schema makes Chapter 6's consumer contract explicit without
 * re-decoding raw HTTP tuple positions there.
 */
export const ResponseWriteSchema = ResponseEvidenceSchema;

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
    response_receipts: z.array(ResponseReceiptSchema).length(4),
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

    const receiptIds = fixture.response_receipts.map(
      (receipt) => receipt.sample_id,
    );
    if (
      receiptIds.length !== sampleIds.length ||
      receiptIds.some((sampleId) => !sampleIds.includes(sampleId)) ||
      new Set(receiptIds).size !== receiptIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["response_receipts"],
        message: "response receipts must cover each physical sample exactly once",
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

const AssessmentDatasetConfigSchema = z
  .object({
    prompt_key: z.literal("question"),
    label_key: z.literal("answer"),
    metadata_key: z.literal("context"),
    n_samples_per_prompt: z.literal(2),
  })
  .strict();

const AssessmentRowSchema = z
  .object({
    question: z.literal("6 × 2 = ?"),
    answer: z.literal("12"),
    context: z
      .object({
        source_name: z.literal("terminal_assessment"),
        difficulty: z.literal("transfer"),
      })
      .strict(),
  })
  .strict();

const AssessmentGroupMemberSchema = z
  .object({
    sample_id: z.enum(["c20", "c21"]),
    group_index: z.literal(7),
    index: z.union([z.literal(20), z.literal(21)]),
  })
  .strict();

/**
 * A fresh transfer trace for the terminal assessment. It is intentionally
 * separate from the 2×2 chapter fixture: learners must reconstruct the
 * contracts on a new origin and non-zero identity counters.
 */
export const ComprehensiveAssessmentFixtureSchema = z
  .object({
    schema_version: z.literal("sample-to-generation-assessment/1"),
    fixture_id: z.literal("assessment-orion-v1"),
    slime_ref: z
      .object({
        tag: z.literal("v0.3.1"),
        describe: z.literal("v0.3.1-1-g06ffdbe2"),
        commit: z.literal("06ffdbe22be068b52f9ed0fc318c473f7030197e"),
      })
      .strict(),
    teaching_notice: z.string().min(1),
    origin_id: z.literal("origin-c"),
    dataset_config: AssessmentDatasetConfigSchema,
    row: AssessmentRowSchema,
    grouping: z
      .object({
        counters_before: z
          .object({ group: z.literal(7), index: z.literal(20) })
          .strict(),
        counters_after: z
          .object({ group: z.literal(8), index: z.literal(22) })
          .strict(),
        members: z.array(AssessmentGroupMemberSchema).length(2),
        focus_sample_id: z.literal("c21"),
        clone_probe: z
          .object({
            mutation: z.literal('c21.metadata.difficulty = "diagnostic"'),
            expected_after: z
              .object({
                c20: z.literal("transfer"),
                c21: z.literal("diagnostic"),
              })
              .strict(),
          })
          .strict(),
      })
      .strict(),
    tokenizer: z
      .object({
        kind: z.literal("teaching-only"),
        notice: z.string().min(1),
        prompt_ids: z.tuple([
          z.literal(41),
          z.literal(42),
          z.literal(43),
          z.literal(44),
          z.literal(45),
        ]),
      })
      .strict(),
    request: z
      .object({
        sample_id: z.literal("c21"),
        method: z.literal("POST"),
        endpoint: z.literal("/generate"),
        payload: SglangPayloadSchema,
      })
      .strict(),
    response_receipt: ResponseReceiptSchema,
    writeback: z
      .object({
        sample_id: z.literal("c21"),
        before: SampleToGenerationSampleSchema,
        after: SampleToGenerationSampleSchema,
      })
      .strict(),
    expected_first_error: z
      .object({
        station_id: z.literal("station-request-boundary"),
        boundary: z.literal("request-payload"),
        path: z.literal("request.payload.input_ids"),
        expected: z.array(z.number().int()).min(1),
        actual: z.array(z.number().int()).min(1),
        explanation: z.string().min(1),
      })
      .strict(),
  })
  .strict()
  .superRefine((fixture, context) => {
    const memberIds = fixture.grouping.members.map((member) => member.sample_id);
    const memberIndices = fixture.grouping.members.map((member) => member.index);
    if (new Set(memberIds).size !== 2 || new Set(memberIndices).size !== 2) {
      context.addIssue({
        code: "custom",
        path: ["grouping", "members"],
        message: "assessment candidates must have unique sample IDs and indices",
      });
    }

    const focus = fixture.grouping.members.find(
      (member) => member.sample_id === fixture.grouping.focus_sample_id,
    );
    if (!focus || focus.group_index !== 7 || focus.index !== 21) {
      context.addIssue({
        code: "custom",
        path: ["grouping", "focus_sample_id"],
        message: "focus sample must resolve to c21=(group 7, index 21)",
      });
    }

    const promptIds = [...fixture.tokenizer.prompt_ids];
    const requestIds = fixture.request.payload.input_ids;
    if (
      requestIds.length !== promptIds.length - 1 ||
      requestIds.some((tokenId, index) => tokenId !== promptIds[index])
    ) {
      context.addIssue({
        code: "custom",
        path: ["request", "payload", "input_ids"],
        message: "the assessment request must omit only the final prompt token",
      });
    }

    const { before, after } = fixture.writeback;
    if (
      before.origin_id !== fixture.origin_id ||
      before.group_index !== focus?.group_index ||
      before.index !== focus?.index ||
      before.tokens.length !== promptIds.length ||
      before.tokens.some((tokenId, index) => tokenId !== promptIds[index])
    ) {
      context.addIssue({
        code: "custom",
        path: ["writeback", "before"],
        message: "writeback must begin from the original five-token c21 Sample",
      });
    }

    const tuples = fixture.response_receipt.raw_body.meta_info.output_token_logprobs ?? [];
    const responseTokens = tuples.map((tuple) => tuple[1]);
    const responseLogProbs = tuples.map((tuple) => tuple[0]);
    const promptPrefixPreserved = promptIds.every(
      (tokenId, index) => after.tokens[index] === tokenId,
    );
    if (
      !promptPrefixPreserved ||
      after.response_length !== responseTokens.length ||
      after.loss_mask?.length !== responseTokens.length ||
      after.rollout_log_probs?.length !== responseTokens.length ||
      responseTokens.some(
        (tokenId, index) => after.tokens[promptIds.length + index] !== tokenId,
      ) ||
      responseLogProbs.some(
        (logProb, index) => after.rollout_log_probs?.[index] !== logProb,
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["writeback", "after"],
        message: "writeback must preserve the prompt prefix and align response-space arrays",
      });
    }

    if (
      fixture.expected_first_error.expected.length !== promptIds.length ||
      fixture.expected_first_error.expected.some(
        (tokenId, index) => tokenId !== promptIds[index],
      ) ||
      fixture.expected_first_error.actual.length !== requestIds.length ||
      fixture.expected_first_error.actual.some(
        (tokenId, index) => tokenId !== requestIds[index],
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["expected_first_error"],
        message: "the expected first error must compare the Sample prefix with the request payload",
      });
    }
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
export type SglangFinishReason = z.infer<typeof SglangFinishReasonSchema>;
export type SglangResponseMetaInfo = z.infer<
  typeof SglangResponseMetaInfoSchema
>;
export type SglangResponseBody = z.infer<typeof SglangResponseBodySchema>;
export type ResponseReceipt = z.infer<typeof ResponseReceiptSchema>;
export type ResponseEvidence = z.infer<typeof ResponseEvidenceSchema>;
export type ResponseWrite = z.infer<typeof ResponseWriteSchema>;
export type SampleToGenerationObservation = z.infer<
  typeof SampleToGenerationObservationSchema
>;
export type SampleToGenerationFixture = z.infer<
  typeof SampleToGenerationFixtureSchema
>;
export type ComprehensiveAssessmentFixture = z.infer<
  typeof ComprehensiveAssessmentFixtureSchema
>;
