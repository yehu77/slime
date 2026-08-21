import {
  RequestSidecarSchema,
  ResponseWriteSchema,
  SampleToGenerationSampleSchema,
  type RequestSidecar,
  type ResponseProjection,
  type ResponseWrite,
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
  response_projections: Readonly<Record<string, ResponseProjection>>;
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

export function projectResponseForWrite(
  projection: ResponseProjection,
): ResponseWrite {
  return ResponseWriteSchema.parse({
    sample_id: projection.sample_id,
    text: projection.text,
    tokens: projection.output_token_logprobs.map((entry) => entry[1]),
    log_probabilities: projection.output_token_logprobs.map((entry) => entry[0]),
    finish_reason: projection.finish_reason,
    weight_version: projection.weight_version,
  });
}

export function appendResponseAtomically(
  sample: SampleToGenerationSample,
  projection: ResponseProjection | ResponseWrite,
): SampleToGenerationSample {
  const write =
    "output_token_logprobs" in projection
      ? projectResponseForWrite(projection)
      : ResponseWriteSchema.parse(projection);
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
  const nextLossMask = [
    ...(sample.loss_mask ?? Array.from({ length: sample.response_length }, () => 1 as const)),
    ...write.tokens.map(() => 1 as const),
  ];
  const nextLogProbabilities = [
    ...(sample.rollout_log_probs ?? []),
    ...write.log_probabilities,
  ];
  if (
    nextLossMask.length !== nextResponseLength ||
    nextLogProbabilities.length !== nextResponseLength
  ) {
    throw new Error(
      `Response metadata mismatch for ${write.sample_id}: response-space arrays must align`,
    );
  }

  return SampleToGenerationSampleSchema.parse({
    ...sample,
    tokens: [...sample.tokens, ...write.tokens],
    response: `${sample.response}${write.text}`,
    response_length: nextResponseLength,
    loss_mask: nextLossMask,
    rollout_log_probs: nextLogProbabilities,
    weight_versions: [...sample.weight_versions, write.weight_version],
    status: write.finish_reason === "stop" ? "completed" : sample.status,
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
    response_projections: {},
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
  let responseProjections = previous.response_projections;
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
      samples = Object.fromEntries(
        Object.entries(samples).map(([sampleId, sample]) => {
          const promptIds = fixture.tokenizer.prompt_encodings[sample.origin_id];
          if (!promptIds) {
            throw new Error(`Missing teaching-tokenizer encoding for ${sample.origin_id}`);
          }
          return [
            sampleId,
            SampleToGenerationSampleSchema.parse({
              ...sample,
              tokens: [...promptIds],
            }),
          ];
        }),
      );
      changedSampleIds = Object.keys(samples);
      break;
    }
    case "requests-prepared": {
      requests = Object.fromEntries(
        Object.entries(samples).map(([sampleId, sample]) => [
          sampleId,
          RequestSidecarSchema.parse({
            sample_id: sampleId,
            method: "POST",
            endpoint: "/generate",
            payload: {
              input_ids: [...sample.tokens],
              sampling_params: cloneJson(fixture.sampling_params),
              return_logprob: true,
            },
          }),
        ]),
      );
      break;
    }
    case "responses-received": {
      responseProjections = Object.fromEntries(
        fixture.response_projections.map((projection) => [
          projection.sample_id,
          cloneJson(projection),
        ]),
      );
      break;
    }
    case "responses-written": {
      // Construct all four next Samples before swapping the map. A malformed
      // projection therefore cannot leave a partially written batch.
      const nextSamples: Record<string, SampleToGenerationSample> = {};
      for (const [sampleId, sample] of Object.entries(samples)) {
        const projection = responseProjections[sampleId];
        if (!projection) {
          throw new Error(`Missing response projection for ${sampleId}`);
        }
        nextSamples[sampleId] = appendResponseAtomically(sample, projection);
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
    response_projections: responseProjections,
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
