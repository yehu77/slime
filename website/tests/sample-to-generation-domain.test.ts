import { describe, expect, it } from "vitest";

import {
  SAMPLE_TO_GENERATION_OBSERVATIONS,
  SampleToGenerationFixtureSchema,
  SampleToGenerationSampleSchema,
  appendResponseAtomically,
  checkSampleToGenerationInvariants,
  cloneSeedSamplesIntoGroups,
  materializeSampleToGenerationStates,
  sampleToGenerationFixture,
  seekSampleToGeneration,
  type ResponseWrite,
} from "@/core/sample-to-generation";

describe("sample-to-generation deterministic trace", () => {
  it("accepts an explicitly unlabeled Sample projection", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    expect(
      SampleToGenerationSampleSchema.parse({
        ...state.seed_samples["origin-a"],
        label: null,
      }).label,
    ).toBeNull();
  });

  it("materializes the seven fixed observation points in order", () => {
    const states = materializeSampleToGenerationStates(
      sampleToGenerationFixture,
    );
    expect(states.map((state) => state.observation_id)).toEqual(
      SAMPLE_TO_GENERATION_OBSERVATIONS,
    );
    for (const state of states) {
      expect(
        checkSampleToGenerationInvariants(state, sampleToGenerationFixture).filter(
          (check) => check.status === "fail",
        ),
      ).toEqual([]);
    }
  });

  it("constructs two seed Samples without inventing generation values", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    expect(state.seed_samples["origin-a"]).toMatchObject({
      prompt: "3 + 2 = ?",
      label: "5",
      tokens: [],
      multimodal_inputs: null,
      response: "",
      response_length: 0,
      reward: null,
      loss_mask: null,
      rollout_log_probs: null,
      status: "pending",
    });
    expect(state.samples).toEqual({});
  });

  it("forms a 2×2 identity matrix with independent clones", () => {
    const seedState = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    const clones = cloneSeedSamplesIntoGroups(
      sampleToGenerationFixture,
      seedState.seed_samples,
    );
    expect(
      Object.fromEntries(
        Object.entries(clones).map(([sampleId, sample]) => [
          sampleId,
          [sample.group_index, sample.index],
        ]),
      ),
    ).toEqual({ a0: [0, 0], a1: [0, 1], b0: [1, 2], b1: [1, 3] });
    expect(clones.a0).not.toBe(clones.a1);
    expect(clones.a0.metadata).not.toBe(clones.a1.metadata);
    clones.a0.metadata.only_a0 = true;
    expect(clones.a1.metadata).not.toHaveProperty("only_a0");
  });

  it("isolates nested metadata and mutable arrays from siblings and the seed", () => {
    const seedState = seekSampleToGeneration(
      sampleToGenerationFixture,
      "samples-constructed",
    );
    const seedA = {
      ...seedState.seed_samples["origin-a"],
      metadata: {
        ...seedState.seed_samples["origin-a"].metadata,
        audit: { notes: [] as string[] },
      },
    };
    const seeds = { ...seedState.seed_samples, "origin-a": seedA };
    const clones = cloneSeedSamplesIntoGroups(sampleToGenerationFixture, seeds);
    const a0Metadata = clones.a0.metadata as { audit: { notes: string[] } };
    const a1Metadata = clones.a1.metadata as { audit: { notes: string[] } };
    const seedMetadata = seedA.metadata as { audit: { notes: string[] } };

    a0Metadata.audit.notes.push("a0-only");
    clones.a0.tokens.push(999);
    clones.a0.weight_versions.push("actor@test");

    expect(a0Metadata.audit.notes).toEqual(["a0-only"]);
    expect(a1Metadata.audit.notes).toEqual([]);
    expect(seedMetadata.audit.notes).toEqual([]);
    expect(clones.a0.metadata).not.toBe(clones.a1.metadata);
    expect(a0Metadata.audit).not.toBe(a1Metadata.audit);
    expect(clones.a0.tokens).not.toBe(clones.a1.tokens);
    expect(clones.a1.tokens).toEqual([]);
    expect(seedA.tokens).toEqual([]);
    expect(clones.a0.weight_versions).not.toBe(clones.a1.weight_versions);
    expect(clones.a1.weight_versions).toEqual([]);
  });

  it("rejects a group plan whose distinct seeds reuse one group_index", () => {
    const invalidFixture = structuredClone(sampleToGenerationFixture);
    invalidFixture.group_plan[1].group_index = invalidFixture.group_plan[0].group_index;
    expect(() => SampleToGenerationFixtureSchema.parse(invalidFixture)).toThrow(
      /group indices must be unique/,
    );
  });

  it("persists prompt tokens only while preparing isolated request snapshots", () => {
    const tokenized = seekSampleToGeneration(
      sampleToGenerationFixture,
      "prompts-tokenized",
    );
    expect(
      Object.fromEntries(
        Object.entries(tokenized.samples).map(([sampleId, sample]) => [
          sampleId,
          sample.tokens,
        ]),
      ),
    ).toEqual({ a0: [], a1: [], b0: [], b1: [] });
    expect(tokenized.changed_sample_ids).toEqual([]);

    const prepared = seekSampleToGeneration(
      sampleToGenerationFixture,
      "requests-prepared",
    );
    expect(prepared.changed_sample_ids).toEqual(["a0", "a1", "b0", "b1"]);
    for (const [sampleId, sample] of Object.entries(prepared.samples)) {
      const request = prepared.requests[sampleId];
      const before = tokenized.samples[sampleId];

      expect(request.payload.input_ids).toEqual(sample.tokens);
      expect(request.payload.input_ids).not.toBe(sample.tokens);
      expect(sample).toEqual({ ...before, tokens: request.payload.input_ids });
      expect(Object.keys(request.payload).sort()).toEqual([
        "input_ids",
        "return_logprob",
        "sampling_params",
      ]);
      expect(request.payload.sampling_params).toEqual(
        sampleToGenerationFixture.sampling_params,
      );
      expect(request.payload.sampling_params).not.toBe(
        sampleToGenerationFixture.sampling_params,
      );
      expect(request.payload.sampling_params.max_new_tokens).toBe(1);
      expect(request.payload.return_logprob).toBe(true);
      expect(request.payload).not.toHaveProperty("sample_id");
      expect(JSON.stringify(request.payload)).not.toMatch(
        /"(?:origin_id|group_index|index|prompt|tokens|multimodal_inputs|response|response_length|label|reward|loss_mask|weight_versions|rollout_log_probs|status|metadata|train_metadata|sample_id)"/,
      );
      expect(sample).toMatchObject({
        response: "",
        response_length: 0,
        reward: null,
        loss_mask: null,
        weight_versions: [],
        rollout_log_probs: null,
        status: "pending",
        train_metadata: null,
      });
    }
  });

  it("keeps the HTTP response in a sidecar until the writeback observation", () => {
    const received = seekSampleToGeneration(
      sampleToGenerationFixture,
      "responses-received",
    );
    expect(received.response_projections.a0).toEqual({
      sample_id: "a0",
      text: "5",
      output_token_logprobs: [[-0.356675, 25]],
      finish_reason: "stop",
      weight_version: "actor@0",
    });
    expect(received.samples.a0.response).toBe("");
    expect(received.samples.a0.status).toBe("pending");
  });

  it("writes four terminal responses while preserving prompt prefixes and null rewards", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "responses-written",
    );
    expect(
      Object.fromEntries(
        Object.entries(state.samples).map(([id, sample]) => [
          id,
          {
            response: sample.response,
            logProb: sample.rollout_log_probs?.[0],
            status: sample.status,
            reward: sample.reward,
          },
        ]),
      ),
    ).toEqual({
      a0: { response: "5", logProb: -0.356675, status: "completed", reward: null },
      a1: { response: "6", logProb: -1.609438, status: "completed", reward: null },
      b0: { response: "7", logProb: -0.430783, status: "completed", reward: null },
      b1: { response: "8", logProb: -1.386294, status: "completed", reward: null },
    });

    for (const sample of Object.values(state.samples)) {
      const prefix =
        sampleToGenerationFixture.tokenizer.prompt_encodings[sample.origin_id];
      expect(sample.tokens.slice(0, prefix.length)).toEqual(prefix);
      expect(sample.response_length).toBe(1);
      expect(sample.loss_mask).toHaveLength(sample.response_length);
      expect(sample.rollout_log_probs).toHaveLength(sample.response_length);
      expect(sample.weight_versions).toEqual(["actor@0"]);
      expect(sample.train_metadata).toBeNull();
    }
    expect(state.samples.a1.response).not.toBe(state.samples.a1.label);
    expect(state.samples.a1.status).toBe("completed");
  });

  it("rejects mismatched response metadata before mutating the original Sample", () => {
    const state = seekSampleToGeneration(
      sampleToGenerationFixture,
      "prompts-tokenized",
    );
    const original = state.samples.a0;
    const before = JSON.stringify(original);
    const malformed = {
      sample_id: "a0",
      text: "56",
      tokens: [25, 26],
      log_probabilities: [-0.356675],
      finish_reason: "stop",
      weight_version: "actor@0",
    } satisfies ResponseWrite;

    expect(() => appendResponseAtomically(original, malformed)).toThrow(
      /token\/log-prob lengths differ/,
    );
    expect(JSON.stringify(original)).toBe(before);
    expect(original.response).toBe("");
    expect(original.status).toBe("pending");
  });
});
