import {
  RequestSidecarSchema,
  ResponseEvidenceSchema,
  ResponseReceiptSchema,
  ResponseWriteSchema,
  SampleToGenerationSampleSchema,
  type RequestSidecar,
  type ResponseEvidence,
  type ResponseReceipt,
  type SampleToGenerationFixture,
  type SampleToGenerationObservationId,
  type SampleToGenerationSample,
  type TeachingRow,
} from "./schema";

export type SampleToGenerationState = {
  fixture_id: string;
  observation_id: SampleToGenerationObservationId;
  observation_index: number;
  rows: Readonly<Record<string, TeachingRow>>;
  seed_samples: Readonly<Record<string, SampleToGenerationSample>>;
  samples: Readonly<Record<string, SampleToGenerationSample>>;
  requests: Readonly<Record<string, RequestSidecar>>;
  /** Caller-associated raw HTTP bodies; never part of the upstream Sample. */
  response_receipts: Readonly<Record<string, ResponseReceipt>>;
  /** Decoded course evidence; Chapter 6 consumes it without re-reading HTTP. */
  response_evidence: Readonly<Record<string, ResponseEvidence>>;
  changed_sample_ids: readonly string[];
};

export type SampleToGenerationAction =
  | { type: "next" }
  | { type: "previous" }
  | { type: "seek"; observation_id: SampleToGenerationObservationId }
  | { type: "reset" };

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeSeedSample(row: TeachingRow): SampleToGenerationSample {
  return SampleToGenerationSampleSchema.parse({
    origin_id: row.origin_id,
    group_index: null,
    index: null,
    prompt: row.text,
    tokens: [],
    multimodal_inputs: null,
    response: "",
    response_length: 0,
    label: row.label,
    reward: null,
    loss_mask: null,
    weight_versions: [],
    rollout_log_probs: null,
    status: "pending",
    metadata: cloneJson(row.metadata),
    train_metadata: null,
  });
}

export function cloneSeedSamplesIntoGroups(
  fixture: SampleToGenerationFixture,
  seedSamples: Readonly<Record<string, SampleToGenerationSample>>,
): Record<string, SampleToGenerationSample> {
  const samples: Record<string, SampleToGenerationSample> = {};
  for (const group of fixture.group_plan) {
    const seed = seedSamples[group.origin_id];
    if (!seed) {
      throw new Error(`Missing seed Sample for ${group.origin_id}`);
    }
    for (const member of group.members) {
      samples[member.sample_id] = SampleToGenerationSampleSchema.parse({
        ...seed,
        group_index: group.group_index,
        index: member.index,
        tokens: [...seed.tokens],
        weight_versions: [...seed.weight_versions],
        metadata: cloneJson(seed.metadata),
      });
    }
  }
  return samples;
}

/**
 * Decode exactly the tuple order used by `sglang_rollout.generate` without
 * mutating the caller-owned Sample. Missing log-prob evidence follows the
 * source fallback and yields two empty response-space arrays.
 */
export function decodeSglangResponseEvidence(
  receiptInput: ResponseReceipt,
): ResponseEvidence {
  const receipt = ResponseReceiptSchema.parse(receiptInput);
  const tuples = receipt.raw_body.meta_info.output_token_logprobs ?? [];
  return ResponseEvidenceSchema.parse({
    sample_id: receipt.sample_id,
    text: receipt.raw_body.text,
    tokens: tuples.map((item) => item[1]),
    log_probabilities: tuples.map((item) => item[0]),
    // Preserve the entire transport envelope, including the raw tuple list
    // and unknown SGLang metadata. The clone makes decoding observational:
    // neither receipt nor fixture objects are ever mutated.
    meta_info: cloneJson(receipt.raw_body.meta_info),
  });
}

export function appendResponseAtomically(
  sample: SampleToGenerationSample,
  evidence: ResponseEvidence,
): SampleToGenerationSample {
  // Chapter 5 already decoded the raw receipt. Chapter 6 consumes the
  // normalized evidence; it must not rediscover tuple positions here.
  const write = ResponseWriteSchema.parse(evidence);
  if (sample.status !== "pending") {
    throw new Error(`Sample ${write.sample_id} is not pending`);
  }
  if (write.tokens.length !== write.log_probabilities.length) {
    throw new Error(
      `Response metadata mismatch for ${write.sample_id}: token/log-prob lengths differ`,
    );
  }

  // Every validation above runs before the next value is constructed. The caller
  // keeps its original object if any validation or schema parse fails.
  const nextResponseLength = sample.response_length + write.tokens.length;
  // `append_response_tokens` only materializes loss_mask when it actually
  // appends response tokens. With a missing/empty log-prob list the source
  // fallback is an empty token list, so a previously-null mask stays null.
  const nextLossMask =
    write.tokens.length === 0
      ? sample.loss_mask === null
        ? null
        : [...sample.loss_mask]
      : [
          ...(sample.loss_mask ??
            Array.from({ length: sample.response_length }, () => 1 as const)),
          ...write.tokens.map(() => 1 as const),
        ];
  const nextLogProbabilities = [
    ...(sample.rollout_log_probs ??
      Array.from({ length: sample.response_length }, () => 0)),
    ...write.log_probabilities,
  ];
  if (
    (nextLossMask !== null && nextLossMask.length !== nextResponseLength) ||
    nextLogProbabilities.length !== nextResponseLength
  ) {
    throw new Error(
      `Response metadata mismatch for ${write.sample_id}: response-space arrays must align`,
    );
  }

  const terminalStatus = (() => {
    switch (write.meta_info.finish_reason.type) {
      case "stop":
        return "completed" as const;
      case "length":
        return "truncated" as const;
      case "abort":
        return "aborted" as const;
    }
  })();

  return SampleToGenerationSampleSchema.parse({
    ...sample,
    tokens: [...sample.tokens, ...write.tokens],
    response: `${sample.response}${write.text}`,
    response_length: nextResponseLength,
    loss_mask: nextLossMask,
    rollout_log_probs: nextLogProbabilities,
    weight_versions: write.meta_info.weight_version
      ? [...sample.weight_versions, write.meta_info.weight_version]
      : [...sample.weight_versions],
    status: terminalStatus,
  });
}

function createEmptyState(fixture: SampleToGenerationFixture): SampleToGenerationState {
  return {
    fixture_id: fixture.fixture_id,
    observation_id: "rows-read",
    observation_index: -1,
    rows: {},
    seed_samples: {},
    samples: {},
    requests: {},
    response_receipts: {},
    response_evidence: {},
    changed_sample_ids: [],
  };
}

function applyObservation(
  previous: SampleToGenerationState,
  fixture: SampleToGenerationFixture,
  observationIndex: number,
): SampleToGenerationState {
  const observation = fixture.observations[observationIndex];
  if (!observation) {
    throw new Error(`Unknown observation index ${observationIndex}`);
  }

  let rows = previous.rows;
  let seedSamples = previous.seed_samples;
  let samples = previous.samples;
  let requests = previous.requests;
  let responseReceipts = previous.response_receipts;
  let responseEvidence = previous.response_evidence;
  let changedSampleIds: string[] = [];

  switch (observation.id) {
    case "rows-read": {
      rows = Object.fromEntries(
        fixture.rows.map((row) => [row.origin_id, cloneJson(row)]),
      );
      break;
    }
    case "samples-constructed": {
      seedSamples = Object.fromEntries(
        Object.values(rows).map((row) => [row.origin_id, makeSeedSample(row)]),
      );
      changedSampleIds = Object.keys(seedSamples);
      break;
    }
    case "groups-built": {
      samples = cloneSeedSamplesIntoGroups(fixture, seedSamples);
      changedSampleIds = Object.keys(samples);
      break;
    }
    case "prompts-tokenized": {
      for (const sample of Object.values(samples)) {
        if (!fixture.tokenizer.prompt_encodings[sample.origin_id]) {
          throw new Error(`Missing teaching-tokenizer encoding for ${sample.origin_id}`);
        }
      }
      break;
    }
    case "requests-prepared": {
      // Mirror the source micro-order for every request: build payload/input_ids,
      // persist prompt tokens on the Sample, then prepare the POST sidecar. Swap
      // both maps only after the complete batch has parsed successfully.
      const nextSamples: Record<string, SampleToGenerationSample> = {};
      const nextRequests: Record<string, RequestSidecar> = {};
      for (const [sampleId, sample] of Object.entries(samples)) {
        const promptIds = fixture.tokenizer.prompt_encodings[sample.origin_id];
        if (!promptIds) {
          throw new Error(`Missing teaching-tokenizer encoding for ${sample.origin_id}`);
        }
        const payload = {
          input_ids: [...promptIds],
          sampling_params: cloneJson(fixture.sampling_params),
          return_logprob: true as const,
        };
        nextSamples[sampleId] = SampleToGenerationSampleSchema.parse({
          ...sample,
          tokens: [...payload.input_ids],
        });
        nextRequests[sampleId] = RequestSidecarSchema.parse({
          sample_id: sampleId,
          method: "POST",
          endpoint: "/generate",
          payload,
        });
      }
      samples = nextSamples;
      requests = nextRequests;
      changedSampleIds = Object.keys(nextSamples);
      break;
    }
    case "responses-received": {
      // Build both course sidecars before publishing either. If one receipt is
      // malformed, callers retain the prior request-prepared state rather than
      // seeing a partial batch of receipts or evidence.
      const nextReceipts: Record<string, ResponseReceipt> = {};
      const nextEvidence: Record<string, ResponseEvidence> = {};
      for (const receiptInput of fixture.response_receipts) {
        const receipt = ResponseReceiptSchema.parse(receiptInput);
        const evidence = decodeSglangResponseEvidence(receipt);
        nextReceipts[receipt.sample_id] = cloneJson(receipt);
        nextEvidence[evidence.sample_id] = cloneJson(evidence);
      }
      responseReceipts = nextReceipts;
      responseEvidence = nextEvidence;
      break;
    }
    case "responses-written": {
      // Construct all four next Samples before swapping the map. A malformed
      // evidence record therefore cannot leave a partially written batch.
      const nextSamples: Record<string, SampleToGenerationSample> = {};
      for (const [sampleId, sample] of Object.entries(samples)) {
        const evidence = responseEvidence[sampleId];
        if (!evidence) {
          throw new Error(`Missing response evidence for ${sampleId}`);
        }
        nextSamples[sampleId] = appendResponseAtomically(sample, evidence);
      }
      samples = nextSamples;
      changedSampleIds = Object.keys(nextSamples);
      break;
    }
  }

  return {
    fixture_id: fixture.fixture_id,
    observation_id: observation.id,
    observation_index: observationIndex,
    rows,
    seed_samples: seedSamples,
    samples,
    requests,
    response_receipts: responseReceipts,
    response_evidence: responseEvidence,
    changed_sample_ids: changedSampleIds,
  };
}

export function seekSampleToGeneration(
  fixture: SampleToGenerationFixture,
  observationId: SampleToGenerationObservationId,
): SampleToGenerationState {
  const targetIndex = fixture.observations.findIndex(
    (observation) => observation.id === observationId,
  );
  if (targetIndex < 0) {
    throw new Error(`Unknown Sample-to-generation observation ${observationId}`);
  }
  let state = createEmptyState(fixture);
  for (let index = 0; index <= targetIndex; index += 1) {
    state = applyObservation(state, fixture, index);
  }
  return state;
}

export function createInitialSampleToGenerationState(
  fixture: SampleToGenerationFixture,
): SampleToGenerationState {
  return seekSampleToGeneration(fixture, "rows-read");
}

export function reduceSampleToGeneration(
  state: SampleToGenerationState,
  action: SampleToGenerationAction,
  fixture: SampleToGenerationFixture,
): SampleToGenerationState {
  if (state.fixture_id !== fixture.fixture_id) {
    throw new Error(
      `State fixture ${state.fixture_id} does not match ${fixture.fixture_id}`,
    );
  }
  switch (action.type) {
    case "next": {
      const index = Math.min(
        state.observation_index + 1,
        fixture.observations.length - 1,
      );
      return seekSampleToGeneration(fixture, fixture.observations[index].id);
    }
    case "previous": {
      const index = Math.max(state.observation_index - 1, 0);
      return seekSampleToGeneration(fixture, fixture.observations[index].id);
    }
    case "seek":
      return seekSampleToGeneration(fixture, action.observation_id);
    case "reset":
      return createInitialSampleToGenerationState(fixture);
  }
}

export function materializeSampleToGenerationStates(
  fixture: SampleToGenerationFixture,
): SampleToGenerationState[] {
  let state = createEmptyState(fixture);
  return fixture.observations.map((_, index) => {
    state = applyObservation(state, fixture, index);
    return state;
  });
}
