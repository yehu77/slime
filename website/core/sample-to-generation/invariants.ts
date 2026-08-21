import type { SampleToGenerationState } from "./reducer";
import type { SampleToGenerationFixture } from "./schema";

export type SampleToGenerationInvariantStatus =
  | "pass"
  | "fail"
  | "not_applicable";

export type SampleToGenerationInvariant = {
  id: string;
  status: SampleToGenerationInvariantStatus;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

function result(
  id: string,
  condition: boolean,
  passMessage: string,
  failMessage: string,
  expected?: unknown,
  actual?: unknown,
): SampleToGenerationInvariant {
  return condition
    ? { id, status: "pass", message: passMessage }
    : { id, status: "fail", message: failMessage, expected, actual };
}

function notApplicable(id: string, message: string): SampleToGenerationInvariant {
  return { id, status: "not_applicable", message };
}

export function checkSampleToGenerationInvariants(
  state: SampleToGenerationState,
  fixture: SampleToGenerationFixture,
): SampleToGenerationInvariant[] {
  const checks: SampleToGenerationInvariant[] = [];
  checks.push(
    result(
      "fixture.two-origins",
      Object.keys(state.rows).length === fixture.expected.origins,
      "Two source rows are present",
      "The trace must begin with exactly two source rows",
      fixture.expected.origins,
      Object.keys(state.rows).length,
    ),
  );

  const knownSamples = [
    ...Object.values(state.seed_samples),
    ...Object.values(state.samples),
  ];
  checks.push(
    result(
      "boundary.reward-remains-null",
      knownSamples.every((sample) => sample.reward === null),
      "Reward remains outside this course boundary",
      "No observation in this course may produce reward",
      null,
      knownSamples.map((sample) => sample.reward),
    ),
    result(
      "boundary.train-metadata-remains-null",
      knownSamples.every((sample) => sample.train_metadata === null),
      "Training metadata remains outside this course boundary",
      "Generation writeback must not create training metadata",
      null,
      knownSamples.map((sample) => sample.train_metadata),
    ),
  );

  if (Object.keys(state.seed_samples).length === 0) {
    checks.push(
      notApplicable(
        "sample.initial-defaults",
        "Dataset has not constructed seed Samples yet",
      ),
    );
  } else {
    checks.push(
      result(
        "sample.initial-defaults",
        Object.values(state.seed_samples).every(
          (sample) =>
            sample.tokens.length === 0 &&
            sample.response === "" &&
            sample.response_length === 0 &&
            sample.loss_mask === null &&
            sample.rollout_log_probs === null &&
            sample.status === "pending",
        ),
        "Dataset construction leaves generation fields at their defaults",
        "Dataset construction must not invent generation output",
      ),
    );
  }

  if (Object.keys(state.samples).length === 0) {
    checks.push(
      notApplicable("group.shape-2x2", "DataSource has not formed groups yet"),
      notApplicable(
        "group.sample-indices-unique",
        "DataSource has not assigned physical identities yet",
      ),
      notApplicable(
        "group.clone-independent",
        "DataSource has not cloned seed Samples yet",
      ),
    );
  } else {
    const samples = Object.values(state.samples);
    const groupCounts = new Map<number, number>();
    for (const sample of samples) {
      if (sample.group_index !== null) {
        groupCounts.set(
          sample.group_index,
          (groupCounts.get(sample.group_index) ?? 0) + 1,
        );
      }
    }
    checks.push(
      result(
        "group.shape-2x2",
        groupCounts.size === fixture.expected.groups &&
          [...groupCounts.values()].every(
            (count) => count === fixture.expected.samples_per_group,
          ) &&
          samples.length === fixture.expected.physical_samples,
        "Two origins form two groups with two physical Samples each",
        "The teaching trace must retain its 2×2 grouping contract",
      ),
    );
    const indices = samples.map((sample) => sample.index);
    checks.push(
      result(
        "group.sample-indices-unique",
        indices.every((index) => index !== null) &&
          new Set(indices).size === samples.length,
        "Every physical Sample has a unique index",
        "Physical Sample indices must be present and unique",
        samples.length,
        new Set(indices).size,
      ),
    );
    const metadataObjects = samples.map((sample) => sample.metadata);
    checks.push(
      result(
        "group.clone-independent",
        metadataObjects.every(
          (metadata, index) =>
            metadataObjects.findIndex((candidate) => candidate === metadata) === index,
        ),
        "Every clone owns an independent metadata object",
        "deepcopy must prevent mutable metadata aliases between candidates",
      ),
    );
  }

  if (state.observation_index < 3) {
    checks.push(
      notApplicable(
        "tokenizer.prompt-ids-present",
        "Prompt tokenization has not run yet",
      ),
    );
  } else {
    checks.push(
      result(
        "tokenizer.prompt-ids-present",
        Object.values(state.samples).every((sample) => {
          const expected = fixture.tokenizer.prompt_encodings[sample.origin_id];
          return JSON.stringify(sample.tokens) === JSON.stringify(expected);
        }) || state.observation_id === "responses-written",
        "Prompt token IDs are present before the request is sent",
        "Each Sample must hold its prompt token prefix before request dispatch",
      ),
    );
  }

  if (Object.keys(state.requests).length === 0) {
    checks.push(
      notApplicable(
        "request.payload-boundary",
        "SGLang request sidecars have not been constructed yet",
      ),
    );
  } else {
    const forbiddenKeys = new Set([
      "label",
      "reward",
      "group_index",
      "index",
      "metadata",
      "train_metadata",
    ]);
    const payloads = Object.values(state.requests).map((request) => request.payload);
    checks.push(
      result(
        "request.payload-boundary",
        payloads.every(
          (payload) =>
            Object.keys(payload).every((key) => !forbiddenKeys.has(key)) &&
            payload.return_logprob === true,
        ),
        "Request payload contains generation inputs, not Sample bookkeeping",
        "label, reward and identity fields must not cross the SGLang request boundary",
      ),
    );
  }

  if (Object.keys(state.response_projections).length === 0) {
    checks.push(
      notApplicable(
        "response.projection-aligned",
        "SGLang response projections have not arrived yet",
      ),
    );
  } else {
    checks.push(
      result(
        "response.projection-aligned",
        Object.values(state.response_projections).every(
          (projection) => projection.output_token_logprobs.length > 0,
        ),
        "Every SGLang response projects at least one token/log-prob tuple",
        "A generated response requires token/log-prob evidence",
      ),
    );
  }

  if (state.observation_id !== "responses-written") {
    checks.push(
      notApplicable(
        "writeback.response-space-aligned",
        "Response data has not been written back to Samples yet",
      ),
      notApplicable(
        "writeback.prompt-prefix-preserved",
        "Response data has not been written back to Samples yet",
      ),
      notApplicable(
        "writeback.actor-version",
        "Response data has not been written back to Samples yet",
      ),
    );
  } else {
    const samples = Object.values(state.samples);
    checks.push(
      result(
        "writeback.response-space-aligned",
        samples.every(
          (sample) =>
            sample.loss_mask?.length === sample.response_length &&
            sample.rollout_log_probs?.length === sample.response_length,
        ),
        "response_length, loss_mask and rollout_log_probs share one coordinate space",
        "Response-side arrays must have exactly response_length entries",
      ),
      result(
        "writeback.prompt-prefix-preserved",
        samples.every((sample) => {
          const prefix = fixture.tokenizer.prompt_encodings[sample.origin_id];
          return prefix.every((token, index) => sample.tokens[index] === token);
        }),
        "Appending a response preserves every prompt token as a prefix",
        "Response writeback must append; it must not replace the prompt prefix",
      ),
      result(
        "writeback.actor-version",
        samples.every(
          (sample) =>
            sample.weight_versions.length === 1 &&
            sample.weight_versions[0] === fixture.expected.generator_weight_version,
        ),
        "Every response records actor@0 as its generation source",
        "The deterministic fixture must use one explicit generator version",
        fixture.expected.generator_weight_version,
        samples.map((sample) => sample.weight_versions),
      ),
      result(
        "writeback.terminal-not-correctness",
        samples.every((sample) => sample.status === "completed") &&
          samples.some((sample) => sample.response !== sample.label),
        "Completed records normal termination even when an answer is wrong",
        "Terminal status must not be treated as reward or answer correctness",
      ),
    );
  }

  return checks;
}

export function getFailedSampleToGenerationInvariants(
  state: SampleToGenerationState,
  fixture: SampleToGenerationFixture,
): SampleToGenerationInvariant[] {
  return checkSampleToGenerationInvariants(state, fixture).filter(
    (check) => check.status === "fail",
  );
}
